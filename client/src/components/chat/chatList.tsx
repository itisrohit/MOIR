"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Sample chat data - replace with your actual data fetching logic
const initialChats = [
	{
		id: 1,
		name: "Alex Johnson",
		avatar: "https://github.com/shadcn.png",
		lastMessage: "I'll send you the files tonight",
		timestamp: "2:34 PM",
		unread: 3,
		online: true,
	},
	{
		id: 2,
		name: "Sarah Williams",
		avatar: "https://github.com/shadcn.png",
		lastMessage: "The meeting is scheduled for tomorrow",
		timestamp: "Yesterday",
		unread: 0,
		online: true,
	},
	{
		id: 3,
		name: "Michael Brown",
		avatar: "",
		lastMessage: "Thanks for your help!",
		timestamp: "Yesterday",
		unread: 0,
		online: false,
	},
	{
		id: 4,
		name: "Emily Davis",
		avatar: "",
		lastMessage: "Let me check that for you",
		timestamp: "Monday",
		unread: 1,
		online: false,
	},
	{
		id: 5,
		name: "Team Chat",
		avatar: "",
		lastMessage: "David: I've pushed the changes",
		timestamp: "Monday",
		unread: 0,
		online: true,
		isGroup: true,
	},
	{
		id: 6,
		name: "David Miller",
		avatar: "",
		lastMessage: "See you at lunch?",
		timestamp: "11:20 AM",
		unread: 2,
		online: true,
	},
	{
		id: 7,
		name: "Olivia Garcia",
		avatar: "",
		lastMessage: "Sounds good to me!",
		timestamp: "Yesterday",
		unread: 0,
		online: false,
	},
	{
		id: 8,
		name: "Work Group",
		avatar: "",
		lastMessage: "Alice: Review the document",
		timestamp: "Today",
		unread: 4,
		online: false,
		isGroup: true,
	},
	{
		id: 9,
		name: "Daniel Martinez",
		avatar: "",
		lastMessage: "Got your message",
		timestamp: "1:45 PM",
		unread: 1,
		online: false,
	},
	{
		id: 10,
		name: "Ava Anderson",
		avatar: "",
		lastMessage: "Catch you later!",
		timestamp: "Tuesday",
		unread: 0,
		online: true,
	},
	{
		id: 11,
		name: "Jason Lee",
		avatar: "",
		lastMessage: "Can you resend the file?",
		timestamp: "Yesterday",
		unread: 2,
		online: true,
	},
	{
		id: 12,
		name: "Grace Harris",
		avatar: "",
		lastMessage: "Great job on the project!",
		timestamp: "3:10 PM",
		unread: 0,
		online: false,
	},
	{
		id: 13,
		name: "Liam Clark",
		avatar: "",
		lastMessage: "Noted, thanks!",
		timestamp: "Today",
		unread: 0,
		online: true,
	},
	{
		id: 14,
		name: "Charlotte Lewis",
		avatar: "",
		lastMessage: "Please call me when free",
		timestamp: "2:00 PM",
		unread: 1,
		online: false,
	},
	{
		id: 15,
		name: "Brian Walker",
		avatar: "",
		lastMessage: "All good on my end",
		timestamp: "Yesterday",
		unread: 0,
		online: false,
	},
	{
		id: 16,
		name: "Design Team",
		avatar: "",
		lastMessage: "Emma: Updated the mockups",
		timestamp: "Today",
		unread: 6,
		online: true,
		isGroup: true,
	},
	{
		id: 17,
		name: "Ethan Hall",
		avatar: "",
		lastMessage: "Will get back to you",
		timestamp: "Thursday",
		unread: 0,
		online: true,
	},
	{
		id: 18,
		name: "Sofia Young",
		avatar: "",
		lastMessage: "Almost done with it",
		timestamp: "Friday",
		unread: 2,
		online: false,
	},
	{
		id: 19,
		name: "Customer Support",
		avatar: "",
		lastMessage: "Your ticket has been resolved",
		timestamp: "Today",
		unread: 0,
		online: false,
		isGroup: true,
	},
	{
		id: 20,
		name: "Zoe Robinson",
		avatar: "",
		lastMessage: "Let’s catch up soon!",
		timestamp: "Sunday",
		unread: 1,
		online: true,
	},
];


export default function ChatList({
	onSelectChat,
	mobileView,
	selectedChatId,
}: {
	onSelectChat: (chatId: number) => void;
	mobileView?: boolean;
	selectedChatId: number | null;
}) {
	const  chats = initialChats;
	const [searchTerm, setSearchTerm] = useState("");

	const filteredChats = searchTerm
		? chats.filter((chat) =>
				chat.name.toLowerCase().includes(searchTerm.toLowerCase())
		  )
		: chats;

	const handleChatSelection = (chatId: number) => {
		onSelectChat(chatId);
	};

	return (
		<div
			className={cn(
				"flex flex-col h-full border-r bg-background",
				// Only apply width-based classes for desktop view
				!mobileView && "w-80"
			)}
		>
			{/* Search bar - adjusted height to match header */}
			<div className="h-[73px] p-4 border-b flex items-center">
				<div className="relative w-full">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search chats..."
						className="pl-10 bg-accent/50"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Chat list */}
			<div className="flex-1 overflow-y-auto">
				{filteredChats.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						No chats found
					</div>
				) : (
					filteredChats.map((chat) => (
						<div
							key={chat.id}
							className={cn(
								"flex items-center p-4 gap-3 cursor-pointer transition-colors",
								"hover:bg-accent/50",
								selectedChatId === chat.id && "bg-accent"
							)}
							onClick={() => handleChatSelection(chat.id)}
						>
							<div className="relative">
								<Avatar className="h-12 w-12 border">
									<AvatarImage src={chat.avatar} alt={chat.name} />
									<AvatarFallback>
										{chat.isGroup
											? "TC"
											: chat.name
													.split(" ")
													.map((n) => n[0])
													.join("")
													.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								{chat.online && (
									<span
										className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"
										aria-hidden="true"
									/>
								)}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex justify-between items-baseline">
									<h3 className="font-medium truncate">{chat.name}</h3>
									<span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
										{chat.timestamp}
									</span>
								</div>
								<p className="text-sm text-muted-foreground truncate">
									{chat.lastMessage}
								</p>
							</div>

							{chat.unread > 0 && (
								<div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
									{chat.unread}
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}