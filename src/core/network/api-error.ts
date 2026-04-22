import axios from "axios";

type BackendErrorPayload = {
  message?: string;
  errors?: Array<{ message?: string; errorMessage?: string; description?: string }>;
};

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as BackendErrorPayload | undefined;

    if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
      return payload.message.trim();
    }

    const firstError = payload?.errors?.find(
      (item) =>
        typeof item?.message === "string" ||
        typeof item?.errorMessage === "string" ||
        typeof item?.description === "string"
    );

    const nestedMessage =
      firstError?.message || firstError?.errorMessage || firstError?.description;

    if (typeof nestedMessage === "string" && nestedMessage.trim().length > 0) {
      return nestedMessage.trim();
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return fallbackMessage;
};
