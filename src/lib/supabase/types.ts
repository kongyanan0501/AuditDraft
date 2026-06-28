// Supabase Postgres 数据库类型。结构对应 supabase/migrations/*.sql。
// 与 src/types/audit.ts 的领域类型解耦：这里是「行级存储结构」，业务层消费领域类型。
//
// 显式声明 Row / Insert / Update（codegen 风格），保证整体满足 supabase-js 的
// GenericSchema 约束——否则 Schema 会被推断为 never，导致 insert/update 失去类型。

import type { AuditReport, JobStatus, RiskLevel } from "@/types/audit";

/** 私有 Storage bucket：审计原始文件（Excel/CSV）按 user 隔离。 */
export const AUDIT_UPLOADS_BUCKET = "audit-uploads";

// 注意：用 `type` 而非 `interface`。interface 不带隐式索引签名，
// 无法赋给 Record<string, unknown>，会让 Database 不满足 GenericSchema。
export type AuditJobRow = {
  id: string;
  user_id: string;
  filename: string;
  /** Storage 内的对象路径（{user_id}/{job_id}/{filename}） */
  storage_path: string | null;
  status: JobStatus;
  created_at: string;
};

export type AuditReportRow = {
  id: string;
  job_id: string;
  report_json: AuditReport;
  risk_level: RiskLevel | null;
  created_at: string;
};

export type AuditRawDataRow = {
  id: string;
  job_id: string;
  data: unknown;
};

/**
 * 供 @supabase/ssr 泛型使用的最小 Database 类型。
 * 只声明本项目用到的表与列，保证 repository 层有静态类型约束。
 */
export interface Database {
  public: {
    Tables: {
      audit_jobs: {
        Row: AuditJobRow;
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          storage_path?: string | null;
          status?: JobStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          storage_path?: string | null;
          status?: JobStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_reports: {
        Row: AuditReportRow;
        Insert: {
          id?: string;
          job_id: string;
          report_json: AuditReport;
          risk_level?: RiskLevel | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          report_json?: AuditReport;
          risk_level?: RiskLevel | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_raw_data: {
        Row: AuditRawDataRow;
        Insert: {
          id?: string;
          job_id: string;
          data: unknown;
        };
        Update: {
          id?: string;
          job_id?: string;
          data?: unknown;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
