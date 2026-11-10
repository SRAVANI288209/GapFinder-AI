/**
 * GapFinder AI - Syllabus Topic Mapper & Past-Paper Analyzer
 * Parses syllabus structure and maps historical examination questions to units & topics.
 */

import { TopicItem, PastPaperQuestion } from '@/types';
import { generateStructuredAIResponse } from './ai';

interface RawUnitOutput {
  unitNumber: number;
  unitName: string;
  weightagePercent?: number;
  topics: {
    title: string;
    description?: string;
    subtopics?: string[];
  }[];
}

interface SyllabusExtractionOutput {
  subjectName: string;
  courseCode?: string;
  units: RawUnitOutput[];
}

interface RawQuestionMapOutput {
  questions: {
    questionText: string;
    year?: string;
    marks?: number;
    mappedUnitNumber?: number;
    mappedTopicTitle?: string;
    confidenceScore: number;
    sourcePage?: number;
  }[];
}

export class TopicMapper {
  /**
   * Extract hierarchical Units -> Topics -> Subtopics from syllabus text
   */
  static async extractTopicsFromSyllabus(
    syllabusText: string,
    userId: string,
    subjectId: string
  ): Promise<TopicItem[]> {
    const systemPrompt = `You are an expert curriculum analyzer.
Your task is to analyze the provided syllabus text and extract a strict, hierarchical structure of:
1. Units (Unit 1, Unit 2, etc.)
2. Major Topics under each unit
3. Subtopics under each topic (if present)

CRITICAL RULES:
- Extract ONLY what is explicitly stated in the syllabus. Do not hallucinate or invent new modules.
- Format the output strictly as a JSON object with:
  {
    "subjectName": "...",
    "courseCode": "...",
    "units": [
      {
        "unitNumber": 1,
        "unitName": "Unit 1: Name",
        "weightagePercent": 25,
        "topics": [
          {
            "title": "Topic Name",
            "description": "Short explanation",
            "subtopics": ["Subtopic 1", "Subtopic 2"]
          }
        ]
      }
    ]
  }`;

    const userPrompt = `SYLLABUS CONTENT:\n${syllabusText.slice(0, 15000)}`;

    try {
      const parsed = await generateStructuredAIResponse<SyllabusExtractionOutput>(
        systemPrompt,
        userPrompt
      );

      const items: TopicItem[] = [];
      let globalOrder = 1;

      if (parsed && parsed.units && Array.isArray(parsed.units)) {
        parsed.units.forEach((unit) => {
          const unitTopics = unit.topics || [];
          unitTopics.forEach((t) => {
            const topicId = `topic-${unit.unitNumber}-${globalOrder}`;
            const subtopics: TopicItem[] = (t.subtopics || []).map((subTitle, subIdx) => ({
              id: `subtopic-${unit.unitNumber}-${globalOrder}-${subIdx + 1}`,
              userId,
              subjectId,
              unitNumber: unit.unitNumber,
              unitName: unit.unitName || `Unit ${unit.unitNumber}`,
              title: subTitle,
              parentTopicId: topicId,
              orderIndex: globalOrder * 10 + subIdx,
            }));

            items.push({
              id: topicId,
              userId,
              subjectId,
              unitNumber: unit.unitNumber,
              unitName: unit.unitName || `Unit ${unit.unitNumber}`,
              title: t.title,
              description: t.description,
              parentTopicId: null,
              examWeightage: unit.weightagePercent || 25,
              orderIndex: globalOrder++,
              subtopics,
            });
          });
        });
      }

      return items;
    } catch (err) {
      console.error('Error extracting syllabus topics:', err);
      // Fallback structured topics
      return [
        {
          id: `topic-fallback-1`,
          userId,
          subjectId,
          unitNumber: 1,
          unitName: 'Unit 1: Core Fundamentals',
          title: 'Introduction & Core Principles',
          orderIndex: 1,
          subtopics: [],
        },
      ];
    }
  }

  /**
   * Extract past examination questions and map them to syllabus topics
   */
  static async mapPastPaperQuestions(
    pastPaperText: string,
    existingTopics: TopicItem[],
    userId: string,
    subjectId: string,
    documentFileName: string
  ): Promise<PastPaperQuestion[]> {
    const topicListSummary = existingTopics
      .map((t) => `ID: ${t.id} | Unit: ${t.unitNumber} (${t.unitName}) | Title: ${t.title}`)
      .join('\n');

    const systemPrompt = `You are an examination question parser.
Extract all examination questions from the past paper text.
For each question:
1. Extract question text, year (if found), and marks (if found).
2. Match it with the most relevant topic from the [TOPIC LIST].
3. Assign a confidence score from 0.0 to 1.0. If confidence < 0.6, leave mappedTopicTitle as "Unmapped".

Output JSON format:
{
  "questions": [
    {
      "questionText": "...",
      "year": "2023",
      "marks": 10,
      "mappedUnitNumber": 1,
      "mappedTopicTitle": "...",
      "confidenceScore": 0.95,
      "sourcePage": 2
    }
  ]
}`;

    const userPrompt = `[TOPIC LIST]:
${topicListSummary}

[PAST PAPER CONTENT]:
${pastPaperText.slice(0, 15000)}`;

    try {
      const parsed = await generateStructuredAIResponse<RawQuestionMapOutput>(
        systemPrompt,
        userPrompt
      );

      const mappedList: PastPaperQuestion[] = [];

      if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q, idx) => {
          // Find matching topic ID from existing topics
          const matchingTopic = existingTopics.find(
            (t) =>
              t.title.toLowerCase().includes((q.mappedTopicTitle || '').toLowerCase()) ||
              (q.mappedTopicTitle || '').toLowerCase().includes(t.title.toLowerCase())
          );

          mappedList.push({
            id: `pq-extracted-${Date.now()}-${idx}`,
            userId,
            subjectId,
            questionText: q.questionText,
            year: q.year || 'Past Exam',
            marks: q.marks || 5,
            mappedTopicId: matchingTopic ? matchingTopic.id : null,
            mappedTopicName: matchingTopic ? matchingTopic.title : q.mappedTopicTitle || 'Unmapped',
            unitName: matchingTopic ? matchingTopic.unitName : `Unit ${q.mappedUnitNumber || '?' }`,
            frequencyCount: 1,
            confidenceScore: q.confidenceScore || 0.8,
            sourceReference: `${documentFileName}, Page ${q.sourcePage || 1}`,
          });
        });
      }

      return mappedList;
    } catch (err) {
      console.error('Error mapping past paper questions:', err);
      return [];
    }
  }
}
