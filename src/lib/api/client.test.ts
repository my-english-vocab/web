import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api/client";
import {
  clearAuthStorage,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/tokens";

function response(status: number, body?: unknown): Response {
  const text = body === undefined ? "" : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(text),
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("apiRequest", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearAuthStorage();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the in-memory access token and always includes cookies", async () => {
    setAccessToken("access-token");
    fetchMock.mockResolvedValueOnce(response(200, { id: 1 }));

    await apiRequest("/api/words");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/words",
      expect.objectContaining({
        credentials: "include",
        headers: { Authorization: "Bearer access-token" },
      }),
    );
  });

  it("returns undefined for a 204 response", async () => {
    fetchMock.mockResolvedValueOnce(response(204));

    await expect(
      apiRequest<void>("/api/words/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("converts a server error body into ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      response(400, { code: "INVALID_WORD", message: "단어를 확인해 주세요." }),
    );

    await expect(apiRequest("/api/words")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "INVALID_WORD",
      message: "단어를 확인해 주세요.",
    } satisfies Partial<ApiError>);
  });

  it("refreshes after a protected 401 and retries the original request", async () => {
    setAccessToken("expired-token");
    fetchMock
      .mockResolvedValueOnce(response(401, { code: "UNAUTHORIZED", message: "만료" }))
      .mockResolvedValueOnce(
        response(200, { accessToken: "new-token", tokenType: "Bearer" }),
      )
      .mockResolvedValueOnce(response(200, { id: 1, term: "apple" }));

    await expect(apiRequest("/api/words/1")).resolves.toEqual({
      id: 1,
      term: "apple",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8080/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8080/api/words/1",
      expect.objectContaining({ headers: { Authorization: "Bearer new-token" } }),
    );
  });

  it("shares one refresh request when concurrent protected requests receive 401", async () => {
    setAccessToken("expired-token");
    let resolveRefresh: (value: Response) => void;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401))
      .mockImplementationOnce(() => refreshResponse)
      .mockResolvedValueOnce(response(200, { id: 1 }))
      .mockResolvedValueOnce(response(200, { id: 2 }));

    const first = apiRequest("/api/words/1");
    const second = apiRequest("/api/words/2");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    resolveRefresh!(
      response(200, { accessToken: "new-token", tokenType: "Bearer" }),
    );

    await expect(Promise.all([first, second])).resolves.toEqual([
      { id: 1 },
      { id: 2 },
    ]);
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith("/api/auth/refresh")),
    ).toHaveLength(1);
  });

  it("clears local authentication when refresh fails", async () => {
    setAccessToken("expired-token");
    localStorage.setItem("mev_user", JSON.stringify({ userId: 1 }));
    fetchMock
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(
        response(401, { code: "REFRESH_EXPIRED", message: "다시 로그인" }),
      );

    await expect(apiRequest("/api/words")).rejects.toMatchObject({ status: 401 });

    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem("mev_user")).toBeNull();
  });
});
