import React, { useRef, useEffect, useState } from "react";
import { GAME_EVENTS } from "@mega-chess/shared";
import { useGameStore } from "../../store/gameStore";
import { useSocket } from "../../hooks/useSocket";

export function Chat(): React.JSX.Element {
  const { chatMessages, playerColor } = useGameStore();
  const { socket } = useSocket();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit(GAME_EVENTS.SEND_CHAT, trimmed);
    setText("");
  }

  return (
    <div className="w-80 shrink-0 h-[30rem] flex flex-col rounded-lg border border-gray-600 bg-gray-800">
      <div className="px-3 py-2 border-b border-gray-600 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Chat
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 text-sm">
        {chatMessages.map((msg, i) => {
          const isYou = msg.color === playerColor;
          return (
            <div key={i} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-white ${isYou ? "bg-blue-500 rounded-br-sm" : "bg-gray-600 rounded-bl-sm"}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex border-t border-gray-600"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          type="text"
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 outline-none"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          className="px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
