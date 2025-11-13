'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, Code, Globe, Users, Sparkles } from "lucide-react";

export interface AgentTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: any;
  category: string;
  system_prompt: string;
  question_processing_prompt?: string;
  tools: Array<{
    tool_name: string;
    tool_description: string;
    is_enabled: boolean;
  }>;
  configurations: Array<{
    config_key: string;
    config_value: any;
    description: string;
  }>;
  few_shot_examples: Array<{
    example_type: string;
    user_query: string;
    expected_output: any;
    description: string;
    is_active: boolean;
  }>;
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'math_agent',
    name: 'math_agent',
    display_name: 'Professor Mathematics',
    description: 'Specializes in Mathematics including algebra, calculus, statistics, and mathematical problem solving.',
    icon: Calculator,
    category: 'Academic',
    system_prompt: `You are a specialized expert in Mathematics for the COSMOS tutoring system. Your name is Professor Mathematics. Your role is to provide clear and accurate answers to questions about algebra, calculus, statistics, geometry, and related mathematical concepts.

IMPORTANT: When users ask for specific questions, exam papers, or previous questions from specific courses/semesters, you MUST use the retrieve_academic_questions tool to search the database first. Only provide answers based on the retrieved data.

Provide helpful mathematical examples and step-by-step solutions when possible. If you retrieve questions from the database, present them in a clear, organized manner.`,
    question_processing_prompt: `You are Professor Mathematics, an expert in Mathematics. A user has asked for questions, and I've retrieved some results from our academic database. Your task is to analyze the user's query, filter the retrieved questions to only show relevant ones based on ACTUAL QUESTION CONTENT, format the response professionally, and present only the most relevant questions (max 5).`,
    tools: [
      {
        tool_name: 'retrieve_academic_questions',
        tool_description: 'Tool to retrieve academic mathematics questions from the database based on user queries',
        is_enabled: true
      },
      {
        tool_name: 'mathematical_calculator',
        tool_description: 'Advanced mathematical calculator for complex computations',
        is_enabled: true
      }
    ],
    configurations: [
      {
        config_key: 'max_questions_per_response',
        config_value: { value: 5, type: 'integer' },
        description: 'Maximum number of questions to show in a single response'
      },
      {
        config_key: 'difficulty_levels',
        config_value: { levels: ['basic', 'intermediate', 'advanced'], default: 'intermediate' },
        description: 'Supported difficulty levels for mathematical questions'
      }
    ],
    few_shot_examples: [
      {
        example_type: 'specific_question',
        user_query: 'Solve the quadratic equation x² + 5x + 6 = 0',
        expected_output: {
          course_title: 'mathematics',
          short: 'math',
          course_code: 'MATH-1101',
          semester_term: '231',
          exam_type: 'mid',
          question_number: '1',
          sub_question: 'a',
          marks: 5,
          total_question_mark: 10,
          contribution_percentage: 50.0,
          has_image: false,
          image_url: '',
          image_type: '',
          has_description: false,
          description_content: '',
          pdf_url: 'https://example.com/math-231-mid-exam.pdf',
          question: 'Solve the quadratic equation x² + 5x + 6 = 0'
        },
        description: 'Example of a specific mathematics question about quadratic equations',
        is_active: true
      }
    ]
  },
  {
    id: 'programming_agent',
    name: 'programming_agent',
    display_name: 'Code Master',
    description: 'Expert in programming languages, algorithms, and software development concepts.',
    icon: Code,
    category: 'Technical',
    system_prompt: `You are Code Master, a programming expert for the COSMOS tutoring system. You specialize in various programming languages including Python, Java, C++, JavaScript, and web development technologies.

IMPORTANT: When users ask for specific programming questions, coding problems, or previous exam questions, you MUST use the retrieve_academic_questions tool to search the database first.

Provide clear code examples, explain algorithms step-by-step, and help with debugging. Always follow best practices and explain the reasoning behind your solutions.`,
    question_processing_prompt: `You are Code Master, a programming expert. Analyze the user's query and retrieved programming questions, filter for relevance, and present the most helpful coding questions (max 5) with proper formatting.`,
    tools: [
      {
        tool_name: 'retrieve_academic_questions',
        tool_description: 'Tool to retrieve programming and computer science questions from the database',
        is_enabled: true
      },
      {
        tool_name: 'code_executor',
        tool_description: 'Execute and test code snippets in various programming languages',
        is_enabled: true
      }
    ],
    configurations: [
      {
        config_key: 'supported_languages',
        config_value: { languages: ['python', 'java', 'cpp', 'javascript', 'html', 'css'], default: 'python' },
        description: 'Programming languages supported by the agent'
      },
      {
        config_key: 'code_style_preference',
        config_value: { style: 'clean', include_comments: true, max_line_length: 80 },
        description: 'Code formatting and style preferences'
      }
    ],
    few_shot_examples: [
      {
        example_type: 'algorithm_question',
        user_query: 'Implement bubble sort algorithm',
        expected_output: {
          course_title: 'computer science',
          short: 'cs',
          course_code: 'CSE-2101',
          semester_term: '231',
          exam_type: 'mid',
          question_number: '2',
          sub_question: 'b',
          marks: 10,
          total_question_mark: 15,
          contribution_percentage: 66.67,
          has_image: false,
          image_url: '',
          image_type: '',
          has_description: true,
          description_content: 'Implementation and analysis of sorting algorithms',
          pdf_url: 'https://example.com/cs-231-mid-exam.pdf',
          question: 'Implement bubble sort algorithm in Python and analyze its time complexity'
        },
        description: 'Example of an algorithm implementation question',
        is_active: true
      }
    ]
  },
  {
    id: 'english_agent',
    name: 'english_agent',
    display_name: 'Professor Literature',
    description: 'Expert in English language, literature, grammar, and writing skills.',
    icon: BookOpen,
    category: 'Language',
    system_prompt: `You are Professor Literature, an English language expert for the COSMOS tutoring system. You specialize in grammar, literature analysis, creative writing, and language comprehension.

IMPORTANT: When users ask for specific English questions, literature analysis, or previous exam questions, you MUST use the retrieve_academic_questions tool to search the database first.

Help students with grammar rules, essay writing, poetry analysis, and improve their overall English proficiency. Provide examples and constructive feedback.`,
    tools: [
      {
        tool_name: 'retrieve_academic_questions',
        tool_description: 'Tool to retrieve English and literature questions from the database',
        is_enabled: true
      },
      {
        tool_name: 'grammar_checker',
        tool_description: 'Advanced grammar and style checking tool',
        is_enabled: true
      }
    ],
    configurations: [
      {
        config_key: 'writing_style',
        config_value: { style: 'academic', formality: 'formal', feedback_level: 'detailed' },
        description: 'Preferred writing style and feedback approach'
      }
    ],
    few_shot_examples: [
      {
        example_type: 'literature_analysis',
        user_query: 'Analyze the theme of love in Romeo and Juliet',
        expected_output: {
          course_title: 'english literature',
          short: 'eng',
          course_code: 'ENG-1201',
          semester_term: '231',
          exam_type: 'final',
          question_number: '1',
          sub_question: '',
          marks: 15,
          total_question_mark: 20,
          contribution_percentage: 75.0,
          has_image: false,
          image_url: '',
          image_type: '',
          has_description: true,
          description_content: 'Literary analysis of major themes',
          pdf_url: 'https://example.com/eng-231-final-exam.pdf',
          question: 'Analyze the theme of love in Shakespeare\'s Romeo and Juliet with specific examples from the text'
        },
        description: 'Example of a literature analysis question',
        is_active: true
      }
    ]
  }
];

interface AgentTemplatesProps {
  onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentTemplates({ onSelectTemplate }: AgentTemplatesProps) {
  const groupedTemplates = agentTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, AgentTemplate[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Agent Templates
        </CardTitle>
        <CardDescription>
          Start with a pre-configured template to quickly create specialized agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {templates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {template.display_name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {template.name}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{template.tools.length} tools</span>
                          <span>•</span>
                          <span>{template.configurations.length} configs</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(template);
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}