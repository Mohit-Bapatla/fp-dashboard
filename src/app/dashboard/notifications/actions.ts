"use server";

import { revalidatePath } from "next/cache";

import {
  markCurrentUserNotificationRead,
  markCurrentUserNotificationsRead,
} from "@/lib/notifications/notifications";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = getString(formData, "notificationId");

  if (!notificationId) {
    return;
  }

  await markCurrentUserNotificationRead(notificationId);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  await markCurrentUserNotificationsRead();
  revalidatePath("/dashboard/notifications");
}
