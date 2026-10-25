import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RoomClient from "@/components/room-client";
export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) { const session=await getSession(); if(!session)redirect("/login"); return <RoomClient roomId={(await params).roomId} name={session.name} />; }
