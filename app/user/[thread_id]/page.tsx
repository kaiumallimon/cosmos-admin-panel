'use client';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyThreadRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const thread_id = params?.thread_id;
    if (thread_id) {
      router.replace(`/user/chat/${thread_id}`);
    } else {
      router.replace('/user/chat');
    }
  }, [params, router]);

  return null;
}
