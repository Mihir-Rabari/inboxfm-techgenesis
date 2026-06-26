export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "cortisol-reduction-audio-briefings",
    title: "Cortisol and Clarity: Why Visual Email Checking Causes Morning Stress",
    excerpt: "Drowning in blue light and notification clutter at 7:00 AM fractures your focus. Discover how auditory-first context retrieval respects your mental energy.",
    date: "June 5, 2026",
    readTime: "5 min read",
    tags: ["Productivity", "Mindfulness", "Design"],
    content: `
Checking email first thing in the morning is a near-universal ritual, and yet it is one of the most cognitively damaging habits of the digital age. 

When you unlock your phone at 7:00 AM, your brain is transitioning from a resting state into active awareness. Flooding it with dozens of visual stimuli—each representing a separate task, thread, or marketing push—forces an immediate release of cortisol (the primary stress hormone). 

### The Cost of Visual Context Switching

Visual scanning is highly demanding. Each unread subject line requires your brain to perform an implicit micro-evaluation:
1. Is this urgent?
2. Who sent this?
3. What is the context?
4. Do I need to reply immediately?

Before you have even stood up, your focus is fragmented. You have entered a reactive, defensive state.

### How Auditory Briefings Rebuild Your Morning

Auditory-first consumption flips this paradigm. By turning visual email threads into a single, cohesive narrative script, Inbox FM changes your relationship with your inbox:

- **Screen-Free Rituals**: You can press play and listen to your morning briefing while making coffee, stretching, or walking. No screen glare, no blue light.
- **Outcome Focus**: Instead of reading 17 separate replies, you hear the synthesized outcome: *"Your client approved the layout changes on slide 4, and the QA team verified the CI pipeline pass."*
- **Intentionality**: You start your day aligned and calm. You sit down at your workspace already knowing what occurred, transitioning directly into deep, creative work rather than reaction loops.
    `
  },
  {
    slug: "behind-the-audio-briefing-engine",
    title: "Behind the Engine: How We Synthesize Coherent Spoken Scripts from Scattered Threads",
    excerpt: "A deep dive into our AI context synthesis pipeline. How we filter out promotional clutter, resolve chronological threads, and produce professional voice outputs.",
    date: "May 28, 2026",
    readTime: "7 min read",
    tags: ["Engineering", "AI", "OAuth"],
    content: `
Building an email-to-audio engine is not as simple as piping email body text to a text-to-speech (TTS) API. If you tried that, you would spend half your morning listening to unsubscribe links, email signatures, duplicate thread history, and promotional noise.

To build Inbox FM, we had to engineer a proprietary three-stage synthesis pipeline.

### Stage 1: The Ingestion and Filter Guard
Using secure Google OAuth 2.0 read-only scopes, we pull email metadata and body components. We immediately run an extraction filter that discards:
- Automated system notifications that don't require action.
- Newsletter templates and marketing wrappers.
- Redundant email signatures and nested historic replies.

### Stage 2: Context Extraction & Thread Resolution
Most emails are part of larger, scattered threads. Reading them chronologically is confusing. 

Our context engine groups related emails into a single "topic." We then instruct our LLM model (Gemini) to synthesize the entire conversation history, identifying:
- Key action items.
- Decisions made.
- Next steps.
- Deadlines.

The output is a professional script, written specifically for natural spoken listening, avoiding bullet points or dry fragments.

### Stage 3: Natural Speech Synthesis
The compiled script is converted to audio using state-of-the-art voice generation with warm, calm tones. The final audio file is stored securely in an encrypted S3 bucket, ready for you to listen on your player.

The result is a clean, 6-minute spoken broadcast that gives you complete context without visual exhaustion.
    `
  },
  {
    slug: "auditory-productivity-screenless-future",
    title: "Resting Your Eyes: The Case for Auditory-First Productivity Workflows",
    excerpt: "We spend 8+ hours a day looking at grids of pixels. Discover the benefits of transitioning your information intake to auditory channels.",
    date: "May 15, 2026",
    readTime: "4 min read",
    tags: ["Productivity", "Wellness"],
    content: `
The modern knowledge worker's day is defined by screens. We jump from visual dashboards to visual chat rooms, visual text documents, and visual slide decks. By late afternoon, we suffer from visual fatigue, reduced reading comprehension, and physical strain.

Yet, our sense of hearing is one of our most powerful channels for context gathering. 

### Why Auditory Comprehension Feels Different

Listening is an active yet calm cognitive process. Unlike visual reading—which is typically fast, fragmented, and prone to distraction—listening allows you to absorb information sequentially:

- **Focus Preservation**: When listening to a professional narrative, you are less likely to open a new browser tab or get sidetracked by notifications.
- **Physical Freedom**: Auditory briefings untether you from your desk. You can absorb key status updates while moving, giving your body a chance to stretch and your eyes a chance to rest.
- **Better Retention**: Hearing the human-like tone of a summary script helps convey nuance, priority, and emotion in messages far better than scanning raw text threads.

Auditory-first productivity isn't about replacing screens entirely; it's about reclaiming the first hour of your day. By making your morning inbox review entirely auditory, you protect your mental clarity and start your workday on your own terms.
    `
  }
];
