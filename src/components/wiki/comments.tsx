"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const comments = [
    {
        id: 1,
        user: "Alex Smith",
        avatar: "https://picsum.photos/seed/2/40/40",
        time: "2 days ago",
        text: "Can we get clarification on how 'Canceled/Carve-Outs' impacts the SLA calculation? It seems to be a gray area."
    },
    {
        id: 2,
        user: "Jane Doe",
        avatar: "https://picsum.photos/seed/3/40/40",
        time: "1 day ago",
        text: "Good question, Alex. My understanding is that they are excluded from the denominator. I've attached the latest reporting guidelines to ticket MPM-1295."
    }
];

export default function Comments() {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Comments & Notes</h3>
      <div className="space-y-6">
        {comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-4">
                <Avatar>
                    <AvatarImage src={comment.avatar} alt={comment.user} data-ai-hint="person face" />
                    <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.user}</p>
                        <p className="text-xs text-muted-foreground">{comment.time}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                </div>
            </div>
        ))}
      </div>
      <div className="mt-6">
        <Textarea placeholder="Add a comment or note..." className="mb-2" />
        <Button>Submit</Button>
      </div>
    </div>
  );
}
