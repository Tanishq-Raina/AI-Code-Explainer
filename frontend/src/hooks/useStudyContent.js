import { useCallback, useEffect, useState } from "react";
import { getStudyTopicContent } from "../api/client";
import {
  isGenericStudyContent,
  studyFallbackContent,
} from "../data/studyFallbackContent";

function getLocalStudyContent(chapterId) {
  return studyFallbackContent[chapterId] || null;
}

export function useStudyContent(chapterId) {
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState("loading");
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!chapterId) {
      setContent(null);
      setStatus("loading");
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");

    getStudyTopicContent(chapterId)
      .then((data) => {
        if (cancelled) return;
        const fallback = getLocalStudyContent(chapterId);
        setContent(fallback && isGenericStudyContent(data) ? fallback : data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load study content:", err);
        const fallback = getLocalStudyContent(chapterId);
        if (fallback) {
          setContent(fallback);
          setStatus("ready");
          return;
        }
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId, requestId]);

  const reload = useCallback(() => setRequestId((value) => value + 1), []);

  return { content, status, reload };
}
