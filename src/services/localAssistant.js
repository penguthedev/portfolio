/**
 * Offline reply engine.
 *
 * Used when no backend is configured, and as the fallback when the API call
 * fails — the assistant keeps working even with the network down.
 */

const REPLIES = [
  {
    keys: ['project', 'work', 'portfolio', 'built', 'build'],
    text: "Lin has shipped 6 highlighted projects — Luminara (a luxury brand site), a hand-gesture-controlled Valentine's experience using MediaPipe, a Psychology AI Chatbot, an Autonomous AI Agent, an Apple website clone, and a Java ATM simulation. Scroll to Selected Works to explore them.",
  },
  {
    keys: ['skill', 'stack', 'tech', 'language', 'python', 'java', 'javascript'],
    text: 'Technical stack: Python, Java, C++, JavaScript, HTML/CSS, MySQL, C, Linux, VMware, PowerShell and networking. On the creative side: UI/UX, mobile app design, luxury web design, prototyping and videography.',
  },
  {
    keys: ['experience', 'job', 'intern', 'freelance', 'career'],
    text: 'Lin freelances as a web developer & UI/UX designer (Jan 2025–present), designed mobile apps, trained as a Technical Assistant at Asia Pacific University, and worked as a Customer Service Specialist at Subway.',
  },
  {
    keys: ['cert', 'qualification', 'credential', 'comptia'],
    text: 'Certifications: Backend Developer, Frontend Developer, Ethical Hacking, and Prompt Engineering — currently training for CompTIA Network+ — plus a BSc in Computer Science in progress at Asia Pacific University.',
  },
  {
    keys: ['contact', 'email', 'phone', 'reach', 'hire', 'linkedin'],
    text: 'You can reach Lin at linnkhant217@gmail.com, +60 13-717 7415, or on LinkedIn at lin-khant. Based in Kuala Lumpur, Malaysia — open to internships and collaborations.',
  },
  {
    keys: ['study', 'university', 'student', 'school', 'apu', 'degree'],
    text: 'Lin is a second-year Computer Science student at Asia Pacific University in Kuala Lumpur, blending backend logic with luxury front-end design.',
  },
  {
    keys: ['language spoken', 'speak', 'burmese', 'mandarin', 'english'],
    text: 'Lin speaks Burmese (native), English (C1 Advanced) and Mandarin (B1 Intermediate).',
  },
  {
    keys: ['ai', 'chatbot', 'agent', 'machine learning'],
    text: "AI is one of Lin's favourite areas — he's built a psychology-focused chatbot with professional-grade empathy and an autonomous agent that completes multi-step tasks without human intervention.",
  },
  {
    keys: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    text: 'Hello! Ask me anything about Lin — his projects, skills, experience, certifications, or how to get in touch.',
  },
  {
    keys: ['who', 'about', 'lin'],
    text: 'Lin Khant is a Computer Science student and creative developer in Kuala Lumpur who crafts luxury digital experiences — moving fluently between backend engineering and high-end front-end design.',
  },
];

const FALLBACK =
  "I can tell you about Lin's projects, skills, experience, certifications, languages, or contact details. What would you like to know?";

export function getLocalReply(input) {
  const q = String(input).toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const r of REPLIES) {
    const score = r.keys.reduce((n, k) => n + (q.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best ? best.text : FALLBACK;
}

export default getLocalReply;
