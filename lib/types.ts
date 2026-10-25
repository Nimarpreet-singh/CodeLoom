export type RoomPolicy = {
  camera: boolean;
  microphone: boolean;
  screenShare: boolean;
  chat: boolean;
  studentEditor: boolean;
  studentCodeVisibleToHost: boolean;
  peerCodeVisible: boolean;
};

export type RoomRole = "host" | "cohost" | "learner";

export const defaultPolicy: RoomPolicy = {
  camera: true, microphone: true, screenShare: true, chat: true,
  studentEditor: true, studentCodeVisibleToHost: true, peerCodeVisible: false,
};
