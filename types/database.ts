// ============================================================
// أنواع قاعدة بيانات Supabase لمنصة مِداد
// هذا الملف يُستخدم مع createClient<Database> لإعطاء
// أنواع صحيحة تلقائياً لكل استعلام
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ---- المستخدمين ----
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'teacher' | 'student' | 'parent'
          status: 'pending' | 'approved' | 'suspended'
          stage: string | null
          grade: string | null
          track: string | null
          theme_color: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'teacher' | 'student' | 'parent'
          status?: 'pending' | 'approved' | 'suspended'
          stage?: string | null
          grade?: string | null
          track?: string | null
          theme_color?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'teacher' | 'student' | 'parent'
          status?: 'pending' | 'approved' | 'suspended'
          stage?: string | null
          grade?: string | null
          track?: string | null
          theme_color?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }

      // ---- المواد الدراسية ----
      subjects: {
        Row: {
          id: string
          name: string
          stage: string
          grade: string
          icon: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          stage: string
          grade: string
          icon?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          stage?: string
          grade?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
      }

      // ---- الدروس ----
      lessons: {
        Row: {
          id: string
          subject_id: string
          title: string
          description: string | null
          chapter: number
          semester: 1 | 2 | 3
          grade: string
          stage: string
          content_file_url: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          title: string
          description?: string | null
          chapter?: number
          semester?: 1 | 2 | 3
          grade: string
          stage: string
          content_file_url?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          title?: string
          description?: string | null
          chapter?: number
          semester?: 1 | 2 | 3
          grade?: string
          stage?: string
          content_file_url?: string | null
          order?: number
          created_at?: string
        }
      }

      // ---- باقات المواد ----
      subject_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          stage: string
          grade: string
          subject_ids: string[]
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          stage: string
          grade: string
          subject_ids?: string[]
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          stage?: string
          grade?: string
          subject_ids?: string[]
          price?: number | null
          created_at?: string
        }
      }

      // ---- اشتراكات الطلاب ----
      student_subscriptions: {
        Row: {
          id: string
          student_id: string
          subject_id: string | null
          package_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id?: string | null
          package_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string | null
          package_id?: string | null
          created_at?: string
        }
      }

      // ---- سجل التوليدات ----
      generation_logs: {
        Row: {
          id: string
          user_id: string
          type: string
          lesson_id: string | null
          input_params: Json
          output_summary: string
          output_format: string
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          lesson_id?: string | null
          input_params?: Json
          output_summary?: string
          output_format?: string
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          lesson_id?: string | null
          input_params?: Json
          output_summary?: string
          output_format?: string
          deleted_at?: string | null
          created_at?: string
        }
      }

      // ---- مخرجات التوليدات ----
      generation_outputs: {
        Row: {
          id: string
          generation_log_id: string
          output_text: string | null
          output_html: string | null
          output_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          generation_log_id: string
          output_text?: string | null
          output_html?: string | null
          output_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          generation_log_id?: string
          output_text?: string | null
          output_html?: string | null
          output_json?: Json | null
          created_at?: string
        }
      }

      // ---- روابط المشاركة ----
      shared_links: {
        Row: {
          id: string
          generation_log_id: string | null
          quiz_id: string | null
          token: string
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          generation_log_id?: string | null
          quiz_id?: string | null
          token: string
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          generation_log_id?: string | null
          quiz_id?: string | null
          token?: string
          expires_at?: string | null
          created_at?: string
        }
      }

      // ---- الفصول ----
      classrooms: {
        Row: {
          id: string
          teacher_id: string
          name: string
          grade: string
          section: string | null
          academic_year: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          grade: string
          section?: string | null
          academic_year: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          grade?: string
          section?: string | null
          academic_year?: string
          created_at?: string
        }
      }

      // ---- ربط الطلاب بالفصول ----
      class_students: {
        Row: {
          class_id: string
          student_id: string
          enrolled_at: string
        }
        Insert: {
          class_id: string
          student_id: string
          enrolled_at?: string
        }
        Update: {
          class_id?: string
          student_id?: string
          enrolled_at?: string
        }
      }

      // ---- الاختبارات ----
      quizzes: {
        Row: {
          id: string
          teacher_id: string
          class_id: string | null
          title: string
          description: string | null
          lesson_ids: string[]
          config: Json
          time_limit_minutes: number | null
          shuffle_questions: boolean
          shuffle_options: boolean
          published: boolean
          attempts_allowed: number
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          class_id?: string | null
          title: string
          description?: string | null
          lesson_ids?: string[]
          config?: Json
          time_limit_minutes?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          published?: boolean
          attempts_allowed?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          class_id?: string | null
          title?: string
          description?: string | null
          lesson_ids?: string[]
          config?: Json
          time_limit_minutes?: number | null
          shuffle_questions?: boolean
          shuffle_options?: boolean
          published?: boolean
          attempts_allowed?: number
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ---- بنك الأسئلة ----
      questions: {
        Row: {
          id: string
          quiz_id: string
          type: string
          text: string
          image_url: string | null
          options: Json | null
          correct_answer: Json | null
          explanation: string
          points: number
          hint: string | null
          bloom_level: string | null
          difficulty: string | null
          lesson_id: string | null
          syntax_target: string | null
          source: 'ai' | 'manual'
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          type: string
          text: string
          image_url?: string | null
          options?: Json | null
          correct_answer?: Json | null
          explanation?: string
          points?: number
          hint?: string | null
          bloom_level?: string | null
          difficulty?: string | null
          lesson_id?: string | null
          syntax_target?: string | null
          source?: 'ai' | 'manual'
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          type?: string
          text?: string
          image_url?: string | null
          options?: Json | null
          correct_answer?: Json | null
          explanation?: string
          points?: number
          hint?: string | null
          bloom_level?: string | null
          difficulty?: string | null
          lesson_id?: string | null
          syntax_target?: string | null
          source?: 'ai' | 'manual'
          sort_order?: number
          created_at?: string
        }
      }

      // ---- محاولات الاختبار ----
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          student_id: string
          answers: Json
          evaluations: Json | null
          score: number | null
          started_at: string
          submitted_at: string | null
          time_spent_seconds: number | null
        }
        Insert: {
          id?: string
          quiz_id: string
          student_id: string
          answers?: Json
          evaluations?: Json | null
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
        }
        Update: {
          id?: string
          quiz_id?: string
          student_id?: string
          answers?: Json
          evaluations?: Json | null
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
        }
      }

      // ---- بطاقات الحفظ ----
      flashcards: {
        Row: {
          id: string
          lesson_id: string
          front: Json
          back: Json
          created_by: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          front: Json
          back: Json
          created_by?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          front?: Json
          back?: Json
          created_by?: string | null
          is_system?: boolean
          created_at?: string
        }
      }

      // ---- تقدم البطاقات ----
      flashcard_progress: {
        Row: {
          id: string
          flashcard_id: string
          student_id: string
          interval_days: number
          ease_factor: number
          repetitions: number
          next_review: string
          last_review: string | null
          mastery_level: 'new' | 'learning' | 'review' | 'mastered'
          times_right: number
          times_wrong: number
        }
        Insert: {
          id?: string
          flashcard_id: string
          student_id: string
          interval_days?: number
          ease_factor?: number
          repetitions?: number
          next_review: string
          last_review?: string | null
          mastery_level?: 'new' | 'learning' | 'review' | 'mastered'
          times_right?: number
          times_wrong?: number
        }
        Update: {
          id?: string
          flashcard_id?: string
          student_id?: string
          interval_days?: number
          ease_factor?: number
          repetitions?: number
          next_review?: string
          last_review?: string | null
          mastery_level?: 'new' | 'learning' | 'review' | 'mastered'
          times_right?: number
          times_wrong?: number
        }
      }

      // ---- ذاكرة السياق التعليمي ----
      context_memory: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          interaction_type: string
          content_summary: string
          performance_signal: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          interaction_type: string
          content_summary?: string
          performance_signal?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          interaction_type?: string
          content_summary?: string
          performance_signal?: number
          metadata?: Json | null
          created_at?: string
        }
      }

      // ---- المهام ----
      assignments: {
        Row: {
          id: string
          teacher_id: string
          class_id: string | null
          title: string
          description: string | null
          type: 'worksheet' | 'quiz' | 'reading' | 'writing' | 'other'
          content_ref: Json | null
          due_date: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          class_id?: string | null
          title: string
          description?: string | null
          type?: 'worksheet' | 'quiz' | 'reading' | 'writing' | 'other'
          content_ref?: Json | null
          due_date?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          class_id?: string | null
          title?: string
          description?: string | null
          type?: 'worksheet' | 'quiz' | 'reading' | 'writing' | 'other'
          content_ref?: Json | null
          due_date?: string | null
          deleted_at?: string | null
          created_at?: string
        }
      }

      // ---- تسليمات المهام ----
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          answers: Json | null
          score: number | null
          feedback: string | null
          graded_by: string | null
          submitted_at: string | null
          graded_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          answers?: Json | null
          score?: number | null
          feedback?: string | null
          graded_by?: string | null
          submitted_at?: string | null
          graded_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          answers?: Json | null
          score?: number | null
          feedback?: string | null
          graded_by?: string | null
          submitted_at?: string | null
          graded_at?: string | null
        }
      }

      // ---- محادثات الدردشة ----
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          lesson_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ---- رسائل الدردشة ----
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
        }
      }

      // ---- الإشعارات ----
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }

      // ---- الإنجازات ----
      achievements: {
        Row: {
          id: string
          code: string
          title_ar: string
          description_ar: string | null
          icon: string
          condition: Json
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title_ar: string
          description_ar?: string | null
          icon: string
          condition: Json
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          title_ar?: string
          description_ar?: string | null
          icon?: string
          condition?: Json
          created_at?: string
        }
      }

      // ---- إنجازات الطلاب ----
      student_achievements: {
        Row: {
          student_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          student_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          student_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }

      // ---- ربط أولياء الأمور بالطلاب ----
      parent_children: {
        Row: {
          parent_id: string
          child_id: string
          relation: 'father' | 'mother' | 'guardian'
        }
        Insert: {
          parent_id: string
          child_id: string
          relation?: 'father' | 'mother' | 'guardian'
        }
        Update: {
          parent_id?: string
          child_id?: string
          relation?: 'father' | 'mother' | 'guardian'
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'teacher' | 'student' | 'parent'
      user_status: 'pending' | 'approved' | 'suspended'
    }
  }
}