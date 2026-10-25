"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading your editor…</div>,
});

type Policy = { camera:boolean; microphone:boolean; screenShare:boolean; chat:boolean; studentEditor:boolean; studentCodeVisibleToHost:boolean; peerCodeVisible:boolean };
type Room = { id:string; title:string; joinCode:string; language:string; status:string; policy:Policy; teacherCode:string; version:number };
type Chat = { id:string; version:number; authorName:string; body:string; createdAt:string };
type Person = { id:string; name:string; role:string };
type RemoteStream = { id:string; stream:MediaStream };
type Submission = { userId:string; name:string; code:string; updatedAt:string };

const ToolIcon = ({ children }: { children: React.ReactNode }) => <span className="tool-icon">{children}</span>;
const isHost = (role: string) => role === "host" || role === "cohost";

export default function RoomClient({ roomId, name }: { roomId:string; name:string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [role, setRole] = useState("learner");
  const [practiceCode, setPracticeCode] = useState("");
  const [practiceVersion, setPracticeVersion] = useState(0);
  const [tab, setTab] = useState<"lesson" | "practice" | "review">("lesson");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [chat, setChat] = useState<Chat[]>([]);
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [error, setError] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const roleRef = useRef("learner");
  const practiceRef = useRef({ code:"", version:0, dirty:false });
  const editorRef = useRef<any>(null);
  const yTextRef = useRef<any>(null);
  const providerRef = useRef<any>(null);
  const bindingRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const attachedPeers = useRef(new Set<string>());
  const mediaAttachedPeers = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRoom = useCallback(async (resetEditors = false) => {
    const response = await fetch(`/api/rooms/${roomId}`, { cache:"no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to join this classroom."); return; }
    setRoom(data.room); roomRef.current = data.room;
    setRole(data.role); roleRef.current = data.role;
    setSubmissions(data.learnerDocuments || []);
    if (resetEditors) {
      setPracticeCode(data.personalCode); setPracticeVersion(data.personalVersion);
      practiceRef.current = { code:data.personalCode, version:data.personalVersion, dirty:false };
    }
    setStatus("Connected");
  }, [roomId]);

  useEffect(() => { fetchRoom(true); }, [fetchRoom]);
  useEffect(() => { const timer = setInterval(() => { void fetchRoom(false); }, 4000); return () => clearInterval(timer); }, [fetchRoom]);

  const attachPeer = useCallback((peerId: string) => {
    const conn = providerRef.current?.room?.webrtcConns?.get(peerId);
    const peer = conn?.peer;
    if (!peer) return;
    if (!attachedPeers.current.has(peerId)) {
      attachedPeers.current.add(peerId);
      peer.on("stream", (stream: MediaStream) => setRemoteStreams((current) => current.some((item) => item.id === peerId) ? current : [...current, { id:peerId, stream }]));
      peer.on("close", () => { attachedPeers.current.delete(peerId); mediaAttachedPeers.current.delete(peerId); setRemoteStreams((current) => current.filter((item) => item.id !== peerId)); });
      peer.on("error", () => setError("A participant media connection was interrupted."));
    }
    if (localStreamRef.current && !mediaAttachedPeers.current.has(peerId)) { peer.addStream(localStreamRef.current); mediaAttachedPeers.current.add(peerId); }
  }, []);

  const attachAllPeers = useCallback(() => {
    const connections: Map<string, unknown> | undefined = providerRef.current?.room?.webrtcConns;
    connections?.forEach((_, peerId) => attachPeer(peerId));
  }, [attachPeer]);

  const bindEditor = useCallback(async () => {
    if (!editorRef.current || !yTextRef.current || bindingRef.current) return;
    const model = editorRef.current.getModel();
    const yText = yTextRef.current;
    let applyingRemoteChange = false;
    const reflectYText = () => {
      const nextValue = yText.toString();
      if (model.getValue() !== nextValue) {
        applyingRemoteChange = true;
        model.setValue(nextValue);
        applyingRemoteChange = false;
      }
    };
    const editorChange = model.onDidChangeContent(() => {
      if (applyingRemoteChange || model.getValue() === yText.toString()) return;
      yText.doc.transact(() => { yText.delete(0, yText.length); yText.insert(0, model.getValue()); });
    });
    yText.observe(reflectYText); reflectYText();
    bindingRef.current = { destroy: () => { editorChange.dispose(); yText.unobserve(reflectYText); } };
  }, []);

  useEffect(() => {
    if (!room || !editorRef.current || providerRef.current) return;
    let disposed = false;
    (async () => {
      const Y = await import("yjs");
      const { WebrtcProvider } = await import("y-webrtc");
      if (disposed) return;
      const doc = new Y.Doc();
      const yText = doc.getText("lesson");
      // Only the host initializes an empty shared document from durable storage.
      if (isHost(roleRef.current) && roomRef.current?.teacherCode) yText.insert(0, roomRef.current.teacherCode);
      const provider = new WebrtcProvider(`codeloom:${roomId}:lesson`, doc, {
        password: roomRef.current?.joinCode,
        maxConns: 8,
      });
      yTextRef.current = yText; providerRef.current = provider;
      provider.awareness.setLocalStateField("user", { name, role:roleRef.current });
      const refreshPeople = () => {
        const entries = Array.from(provider.awareness.getStates().entries()).map(([id, state]: any) => ({ id:String(id), name:state.user?.name || "Participant", role:state.user?.role || "learner" }));
        setPeople(entries);
      };
      provider.awareness.on("change", refreshPeople); refreshPeople();
      provider.on("status", ({ connected }: { connected:boolean }) => setStatus(connected ? "Live sync connected" : "Reconnecting…"));
      provider.on("peers", () => setTimeout(attachAllPeers, 250));
      yText.observe(() => {
        if (isHost(roleRef.current)) {
          setStatus("Syncing lesson…");
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => persistLesson(), 1000);
        }
      });
      await bindEditor();
      setTimeout(attachAllPeers, 500);
    })();
    return () => {
      disposed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      bindingRef.current?.destroy(); bindingRef.current = null;
      providerRef.current?.destroy(); providerRef.current = null;
      yTextRef.current = null; attachedPeers.current.clear(); mediaAttachedPeers.current.clear();
    };
  // Collaboration lifecycle should restart only if the classroom identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id, roomId, editorReady, attachAllPeers, bindEditor]);

  const persistLesson = useCallback(async () => {
    if (!isHost(roleRef.current) || !yTextRef.current || !roomRef.current) return;
    const code = yTextRef.current.toString();
    const response = await fetch(`/api/rooms/${roomId}/code`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code, version:roomRef.current.version }) });
    const data = await response.json();
    if (response.ok) { roomRef.current = { ...roomRef.current, version:data.version, teacherCode:code }; setRoom(roomRef.current); setStatus("All changes live"); }
    else if (response.status === 409) { setError("The saved lesson changed elsewhere. Refresh the page before continuing."); }
    else setError(data.error || "Could not save the lesson snapshot.");
  }, [roomId]);

  const onEditorMount: OnMount = (editor) => { bindingRef.current?.destroy(); bindingRef.current = null; editorRef.current = editor; setEditorReady(true); void bindEditor(); };

  async function savePractice(nextCode: string, nextVersion: number) {
    const response = await fetch(`/api/rooms/${roomId}/code`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code:nextCode, version:nextVersion }) });
    const data = await response.json();
    if (response.ok) { practiceRef.current.version = data.version; setPracticeVersion(data.version); setStatus("Practice saved"); }
    else if (response.status === 409) { practiceRef.current = { code:data.currentCode, version:data.currentVersion, dirty:false }; setPracticeCode(data.currentCode); setPracticeVersion(data.currentVersion); setError("Your practice editor changed in another tab, so it was refreshed."); }
    else setError(data.error || "Could not save your practice.");
  }

  function updatePractice(nextCode: string) {
    setPracticeCode(nextCode); practiceRef.current.code = nextCode; practiceRef.current.dirty = true; setStatus("Saving practice…");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { practiceRef.current.dirty = false; void savePractice(practiceRef.current.code, practiceRef.current.version); }, 800);
  }

  useEffect(() => {
    let since = 0; let active = true;
    const tick = async () => { try { const response = await fetch(`/api/rooms/${roomId}/events?since=${since}`, { cache:"no-store" }); if (response.ok) { const data = await response.json(); if (data.events.length) setChat((current) => [...current, ...data.events.filter((event:Chat) => !current.some((item) => item.id === event.id))]); since = data.version; } } finally { if (active) setTimeout(tick, 1800); } };
    void tick(); return () => { active = false; };
  }, [roomId]);

  async function send(event: FormEvent) { event.preventDefault(); if (!message.trim()) return; const body = message; setMessage(""); const response = await fetch(`/api/rooms/${roomId}/events`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ body }) }); if (!response.ok) setError((await response.json()).error || "Message could not be sent."); }
  async function setPolicy(key: keyof Policy, value: boolean) { if (!room) return; const policy = { ...room.policy, [key]:value }; setRoom({ ...room, policy }); roomRef.current = { ...room, policy }; const response = await fetch(`/api/rooms/${roomId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ policy }) }); if (!response.ok) setError("That setting could not be saved."); }
  async function toggleLive() { if (!room) return; const status = room.status === "live" ? "waiting" : "live"; setRoom({ ...room, status }); roomRef.current = { ...room, status }; await fetch(`/api/rooms/${roomId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) }); }

  async function enableMedia() {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true });
      stream.getAudioTracks().forEach((track) => track.enabled = false);
      stream.getVideoTracks().forEach((track) => track.enabled = false);
      localStreamRef.current = stream; setLocalStream(stream); attachAllPeers(); return stream;
    } catch { setError("Camera and microphone access was not granted. You can allow it in your browser settings."); return null; }
  }
  async function toggleMic() { if (!room?.policy.microphone) return setError("The host has paused microphones."); const stream = await enableMedia(); if (!stream) return; const enabled = !micOn; stream.getAudioTracks().forEach((track) => track.enabled = enabled); setMicOn(enabled); }
  async function toggleCamera() { if (!room?.policy.camera) return setError("The host has paused cameras."); const stream = await enableMedia(); if (!stream) return; const enabled = !cameraOn; stream.getVideoTracks().forEach((track) => track.enabled = enabled); setCameraOn(enabled); }
  async function shareScreen() { if (!room?.policy.screenShare) return setError("The host has paused screen sharing."); try { const stream = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:false }); const track = stream.getVideoTracks()[0]; track.addEventListener("ended", () => { setSharing(false); setLocalStream(localStreamRef.current); }); providerRef.current?.room?.webrtcConns?.forEach((connection:any) => connection.peer?.addStream(stream)); setLocalStream(stream); setSharing(true); } catch { /* User dismissed browser sharing chooser. */ } }
  function runCode() { const source = tab === "lesson" ? yTextRef.current?.toString() : tab === "review" ? reviewing?.code : practiceCode; if (!source?.trim()) return setError("Write some JavaScript before running it."); setRunning(true); setOutput(""); const frame = document.createElement("iframe"); frame.sandbox.add("allow-scripts"); frame.style.display = "none"; frame.srcdoc = `<script>window.addEventListener('message',e=>{try{const logs=[];const safeConsole={log:(...v)=>logs.push(v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' '))};const result=Function('console',e.data)(safeConsole);parent.postMessage({type:'codeloom-result',output:logs.join('\\n')||(result===undefined?'Program finished with no output.':String(result))},'*')}catch(error){parent.postMessage({type:'codeloom-result',output:error.name+': '+error.message},'*')}})</script>`;
    const complete = (output:string) => { clearTimeout(timeout); window.removeEventListener("message", receive); frame.remove(); setRunning(false); setOutput(output); };
    const receive = (event:MessageEvent) => { if (event.source === frame.contentWindow && event.data?.type === "codeloom-result") complete(event.data.output); };
    const timeout = setTimeout(() => complete("Execution stopped after 2 seconds."), 2000);
    window.addEventListener("message", receive); document.body.appendChild(frame); frame.addEventListener("load", () => frame.contentWindow?.postMessage(source, "*")); }

  useEffect(() => () => { localStreamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  if (error && !room) return <main className="room-error"><h1>We couldn’t open this classroom.</h1><p>{error}</p><a className="button" href="/dashboard">Back to classrooms</a></main>;
  const host = isHost(role); const lessonReadOnly = !host;
  return <main className="room">
    <header className="room-header"><a className="brand" href="/dashboard"><span className="brand-mark">ϟ</span>codeloom</a><div className="room-title"><span className={room?.status === "live" ? "status-live" : "status-wait"}/><strong>{room?.title || "Opening classroom…"}</strong><small>{room?.status === "live" ? "Live now" : "Waiting room"}</small></div><div className="room-actions">{host && <button className="share-code" onClick={() => navigator.clipboard.writeText(room?.joinCode || "")}>Invite · {room?.joinCode}</button>}<span className="room-me">{name.slice(0,2).toUpperCase()}</span></div></header>
    <div className="room-layout">
      <aside className="people-panel"><div className="panel-label">IN THE ROOM · {people.length || 1}</div>{people.length ? people.map((person) => <div className="you-row" key={person.id}><span className="presence"/><span className="person-initial">{person.name.slice(0,2).toUpperCase()}</span><span>{person.name} {person.name === name && <small>you</small>}</span></div>) : <div className="alone">Waiting for the secure room connection…</div>}{host && room?.policy.studentCodeVisibleToHost && <div className="review-list"><div className="panel-label">LEARNER WORK</div>{submissions.length ? submissions.map((submission) => <button key={submission.userId} onClick={() => { setReviewing(submission); setTab("review"); }}>{submission.name}<span>Review →</span></button>) : <p>Learner work appears after they begin coding.</p>}</div>}<div className="media-note"><ToolIcon>◉</ToolIcon><div><strong>Peer-to-peer call</strong><p>Best for small classes. Video is sent directly between participants.</p></div></div></aside>
      <section className="workspace"><div className="workspace-top"><div className="tabs"><button className={tab === "lesson" ? "active" : ""} onClick={() => setTab("lesson")}>Teacher&apos;s lesson</button>{!host && <button className={tab === "practice" ? "active" : ""} onClick={() => setTab("practice")}>My practice</button>}{host && reviewing && <button className={tab === "review" ? "active" : ""} onClick={() => setTab("review")}>{reviewing.name}&apos;s work</button>}</div><div className="editor-actions"><button onClick={runCode} disabled={running}>{running ? "Running…" : "▶ Run JS"}</button><div className="editor-status"><i/> {status}</div></div></div>
        {tab === "lesson" ? <div className="lesson-view"><Editor height="100%" theme="vs-dark" language="javascript" onMount={onEditorMount} options={{ readOnly:lessonReadOnly, minimap:{enabled:false}, fontSize:14, padding:{top:18}, automaticLayout:true }}/>{lessonReadOnly && <span className="read-only">READ ONLY · LIVE HOST LESSON</span>}</div> : tab === "review" ? <div className="lesson-view"><Editor height="100%" theme="vs-dark" language="javascript" value={reviewing?.code || ""} options={{ readOnly:true, minimap:{enabled:false}, fontSize:14, padding:{top:18}, automaticLayout:true }}/><span className="read-only">READ ONLY · LEARNER PRACTICE</span></div> : <div className="editor-wrap"><Editor height="100%" theme="vs-dark" language="javascript" value={practiceCode} onChange={(value) => updatePractice(value || "")} options={{ readOnly:!room?.policy.studentEditor, minimap:{enabled:false}, fontSize:14, padding:{top:18}, automaticLayout:true }}/>{!room?.policy.studentEditor && <div className="editor-locked">The host has paused learner editors.</div>}</div>}
        {output && <pre className="run-output">{output}</pre>}
        {localStream && <video className="local-video" autoPlay muted playsInline ref={(element) => { if (element && element.srcObject !== localStream) element.srcObject = localStream; }}/>} {remoteStreams.map((remote) => <video className="remote-video" autoPlay playsInline key={remote.id} ref={(element) => { if (element && element.srcObject !== remote.stream) element.srcObject = remote.stream; }}/>) }
        <div className="call-dock"><button className={micOn ? "media-on" : ""} title="Toggle microphone" onClick={toggleMic} disabled={!room?.policy.microphone}><ToolIcon>⌁</ToolIcon><small>Mic</small></button><button className={cameraOn ? "media-on" : ""} title="Toggle camera" onClick={toggleCamera} disabled={!room?.policy.camera}><ToolIcon>◉</ToolIcon><small>Camera</small></button><button className={sharing ? "media-on" : ""} title="Share screen" onClick={shareScreen} disabled={!room?.policy.screenShare}><ToolIcon>▣</ToolIcon><small>Present</small></button><span className="dock-rule"/>{host && <button className="live-button" onClick={toggleLive}>{room?.status === "live" ? "End live class" : "Start class"}</button>}<button className="settings-button" onClick={() => setShowSettings(!showSettings)}>⚙</button></div>
      </section>
      <aside className="chat-panel"><div className="chat-head"><strong>Chat</strong><span>{room?.policy.chat ? "Open" : "Paused"}</span></div><div className="messages">{chat.length === 0 ? <div className="chat-empty">Questions, links, and helpful notes will live here.</div> : chat.map((item) => <article key={item.id}><b>{item.authorName}</b><p>{item.body}</p></article>)}</div><form className="message-form" onSubmit={send}><input disabled={!room?.policy.chat} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={room?.policy.chat ? "Message everyone…" : "Chat paused by host"}/><button disabled={!room?.policy.chat}>↑</button></form></aside>
    </div>
    {showSettings && host && room && <div className="settings-popover"><div><h3>Classroom controls</h3><button onClick={() => setShowSettings(false)}>×</button></div><p>Decide how people can participate.</p>{([['camera','Allow cameras'],['microphone','Allow microphones'],['screenShare','Allow screen sharing'],['chat','Enable class chat'],['studentEditor','Enable learner editors'],['studentCodeVisibleToHost','Let hosts view learner code'],['peerCodeVisible','Let learners view each other’s code']] as [keyof Policy,string][]).map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={room.policy[key]} onChange={(event) => setPolicy(key,event.target.checked)}/><i/></label>)}</div>}
    {error && <div className="toast">{error}<button onClick={() => setError("")}>×</button></div>}
  </main>;
}
