// Move initialChats array here to be shared between components
export const initialChats = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://github.com/shadcn.png",
    lastMessage: "I'll send you the files tonight",
    timestamp: "2:34 PM",
    unread: 3,
    online: true,
    messages: [
      { id: 1, text: "Hey there! How's it going?", sender: "them", time: "2:30 PM" },
      { id: 2, text: "I'm doing well, thanks! Just working on the project.", sender: "me", time: "2:31 PM" },
      { id: 3, text: "Cool! I wanted to ask about the deadline for the next milestone.", sender: "them", time: "2:32 PM" },
      { id: 4, text: "I think we have until next Friday, but let me check my notes and get back to you.", sender: "me", time: "2:33 PM" },
      { id: 5, text: "I'll send you the files tonight", sender: "them", time: "2:34 PM" },
    ],
  },
  {
    id: 2,
    name: "Maria Gonzalez",
    avatar: null,
    lastMessage: "Lunch tomorrow?",
    timestamp: "1:12 PM",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Want to grab lunch tomorrow?", sender: "them", time: "1:11 PM" },
      { id: 2, text: "Sure, sounds great!", sender: "me", time: "1:12 PM" },
    ],
  },
  {
    id: 3,
    name: "Daniel Wu",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    lastMessage: "Just finished the report.",
    timestamp: "Yesterday",
    unread: 1,
    online: true,
    messages: [
      { id: 1, text: "Report is done. Just sent it over email.", sender: "them", time: "10:45 AM" },
    ],
  },
  {
    id: 4,
    name: "Priya Patel",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    lastMessage: "Let's meet at 4?",
    timestamp: "11:23 AM",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Are you free at 4?", sender: "them", time: "11:22 AM" },
      { id: 2, text: "Yes, that works.", sender: "me", time: "11:23 AM" },
    ],
  },
  {
    id: 5,
    name: "Omar Al-Fayed",
    avatar: null,
    lastMessage: "See you at the event!",
    timestamp: "2 days ago",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Looking forward to the event.", sender: "them", time: "Wednesday 5:00 PM" },
      { id: 2, text: "See you there!", sender: "me", time: "Wednesday 5:05 PM" },
    ],
  },
];

export type ChatItem = (typeof initialChats)[0];
