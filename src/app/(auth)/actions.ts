"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email("请输入合法的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

/** 安全地取一个站内相对路径，避免开放重定向。 */
function safeRedirect(target: FormDataEntryValue | null): string {
  const value = typeof target === "string" ? target : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function buildError(scope: "login" | "register", message: string): string {
  return `/${scope}?error=${encodeURIComponent(message)}`;
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(buildError("login", parsed.error.issues[0]?.message ?? "输入有误"));
  }

  const redirectTo = safeRedirect(formData.get("redirectTo"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(buildError("login", error.message));
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(
      buildError("register", parsed.error.issues[0]?.message ?? "输入有误"),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    redirect(buildError("register", error.message));
  }

  // 若项目开启了邮箱确认，signUp 不会立即创建 Session。
  if (!data.session) {
    redirect(
      `/login?notice=${encodeURIComponent("注册成功，请查收邮件完成验证后登录")}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
