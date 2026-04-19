import { format } from 'date-fns';

const MODEL = 'gemini-2.5-flash-lite';

export const extractTopicsFromImage = async (base64Image) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('Please set your Gemini API key in the .env file (VITE_GEMINI_API_KEY)');
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  
  // Extract base64 payload (strip the "data:image/jpeg;base64," prefix)
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/jpeg';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'You are an OCR assistant. Extract all syllabus topics, chapters, and units from this image as a clean, numbered list. Return only the list, nothing else.' }]
      },
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: 'Extract all topics, chapters, and units from this syllabus image as a numbered list. Return only the list, nothing else.' }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export const generateSchedule = async (subjects, hoursPerDay, daysOff) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('Please set your Gemini API key in the .env file (VITE_GEMINI_API_KEY)');
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const today = format(new Date(), 'yyyy-MM-dd');

  const subjectList = subjects
    .map(s => {
      let details = `- Subject: ${s.name}\n  Exam Date: ${s.examDate}\n  Priority: ${s.priority}`;
      if (s.syllabusText) {
        details += `\n  Syllabus Topics: ${s.syllabusText}`;
      }
      return details;
    })
    .join('\n');

  const daysOffList = daysOff.length > 0 ? daysOff.join(', ') : 'None';

  const userPrompt = `I have the following exams:
${subjectList}

I can study ${hoursPerDay} hours per day.
Days off: ${daysOffList}.
Today: ${today}.

Create a day-by-day schedule from today to the last exam date. For each day:
1. Subject(s) to study
2. Hours for each subject
3. Specific topics to focus on
4. A motivational tip

IMPORTANT INSTRUCTIONS:
1. If a subject has syllabus topics listed above, distribute those EXACT topics across the schedule days. Do not invent topics for subjects with a provided syllabus.
2. If a subject has NO syllabus, generate reasonable topics based on the subject name.
3. Heavier/complex topics should be scheduled earlier; revision sessions closer to exam date.
4. Subjects with HIGH priority get more time and more frequent sessions.
5. Never schedule a subject after its exam date.
6. Make sure the total hours per day does not exceed ${hoursPerDay}. Skip days off.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no extra text. The format must be exactly:
{"schedule": [{"date": "YYYY-MM-DD", "entries": [{"subject": "SubjectName", "hours": N, "topics": ["topic1", "topic2"], "tip": "motivational tip"}]}]}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{
          text: 'You are an expert academic planner. Generate detailed, realistic, and motivating study schedules. Always respond with valid JSON only — no markdown, no code fences, no explanation text.'
        }]
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `API request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  // Extract text content from Gemini response
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('No text content in API response');
  }

  // Parse JSON — handle potential markdown code fences
  let cleaned = textContent.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
      throw new Error('Invalid schedule format');
    }
    return parsed.schedule;
  } catch (parseErr) {
    console.error('Failed to parse schedule JSON:', cleaned);
    throw new Error('Failed to parse the AI-generated schedule. Please try again.');
  }
};
