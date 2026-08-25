"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import {
  getAdminAccountLifecycle,
  getAdminDailyStatistics,
  getAdminMonthlyStatistics,
  getAdminOverview,
  getAdminPopularPages,
  getAdminPopularWords,
  getAdminUsers,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type {
  AdminAccountLifecycle,
  AdminDailyStatistics,
  AdminMonthlyStatistics,
  AdminOverview,
  AdminPopularPage,
  AdminPopularWord,
  AdminUser,
} from "@/lib/api/types";
import styles from "./admin.module.css";

type DashboardData = {
  overview: AdminOverview;
  daily: AdminDailyStatistics[];
  monthly: AdminMonthlyStatistics[];
  popularWords: AdminPopularWord[];
  popularPages: AdminPopularPage[];
  users: AdminUser[];
  lifecycle: AdminAccountLifecycle[];
};

const numberFormatter = new Intl.NumberFormat("ko-KR");
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "기록 없음";
  return dateTimeFormatter.format(new Date(value));
}

function formatDay(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatMonth(value: string) {
  return value.replace("-", ".");
}

function pageLabel(path: string) {
  const labels: Record<string, string> = {
    "/": "시작",
    "/home": "홈",
    "/words": "단어장",
    "/words/add": "단어 추가",
    "/quiz": "퀴즈",
    "/admin": "운영 대시보드",
  };
  return labels[path] ?? path;
}

async function getDashboardData(): Promise<DashboardData> {
  const [
    overview,
    daily,
    monthly,
    popularWords,
    popularPages,
    users,
    lifecycle,
  ] = await Promise.all([
    getAdminOverview(),
    getAdminDailyStatistics(7),
    getAdminMonthlyStatistics(6),
    getAdminPopularWords(5),
    getAdminPopularPages(30, 5),
    getAdminUsers(100),
    getAdminAccountLifecycle(20),
  ]);

  return {
    overview,
    daily,
    monthly,
    popularWords,
    popularPages,
    users,
    lifecycle,
  };
}

function dashboardErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "운영 통계를 불러오지 못했어요.";
}

function MetricCard({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
}) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>
        {formatNumber(value)}
        {suffix ? <span>{suffix}</span> : null}
      </p>
      <p className={styles.metricHint}>{hint}</p>
    </article>
  );
}

function EmptyList({ children }: { children: React.ReactNode }) {
  return <p className={styles.emptyList}>{children}</p>;
}

function AdminDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      setData(await getDashboardData());
      setUpdatedAt(new Date());
    } catch (err) {
      setError(dashboardErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getDashboardData()
      .then((result) => {
        if (!active) return;
        setData(result);
        setUpdatedAt(new Date());
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(dashboardErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const trendMax = useMemo(() => {
    if (!data) return { activeUsers: 1, pageViews: 1 };
    return {
      activeUsers: Math.max(...data.daily.map((item) => item.activeUsers), 1),
      pageViews: Math.max(...data.daily.map((item) => item.pageViews), 1),
    };
  }, [data]);

  const refreshButton = (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={() => void loadDashboard(true)}
      disabled={loading || refreshing}
    >
      {refreshing ? "갱신 중" : "새로고침"}
    </button>
  );

  return (
    <PageShell
      title="운영 대시보드"
      showBack
      backHref="/home"
      rightSlot={refreshButton}
      className={styles.page}
      showFloatingBackOnScroll
    >
      {loading ? <Spinner label="운영 통계를 불러오는 중..." /> : null}

      {!loading && error && !data ? (
        <section className={styles.errorCard} role="alert">
          <p className={styles.errorTitle}>통계를 불러오지 못했어요</p>
          <p>{error}</p>
          <button type="button" onClick={() => void loadDashboard()}>
            다시 시도
          </button>
        </section>
      ) : null}

      {data ? (
        <div className={styles.dashboard} aria-busy={refreshing}>
          <section className={styles.intro}>
            <div>
              <span className={styles.adminBadge}>ADMIN</span>
              <h2>서비스 현황</h2>
              <p>회원과 학습 활동을 한국 시간 기준으로 확인합니다.</p>
            </div>
            <div className={styles.updatedAt} aria-live="polite">
              <span className={styles.liveDot} aria-hidden />
              {updatedAt ? `${dateTimeFormatter.format(updatedAt)} 갱신` : "갱신 전"}
            </div>
          </section>

          {error ? (
            <div className={styles.inlineError} role="alert">
              {error} 이전 조회 결과를 표시하고 있습니다.
            </div>
          ) : null}

          <section className={styles.heroGrid} aria-label="핵심 운영 지표">
            <article className={styles.heroPrimary}>
              <div>
                <p>오늘 활성 사용자</p>
                <strong>{formatNumber(data.overview.dailyActiveUsers)}</strong>
                <span>명</span>
              </div>
              <p className={styles.heroFootnote}>
                최근 활동 {formatDateTime(data.overview.mostRecentActivityAt)}
              </p>
            </article>
            <article className={styles.heroSecondary}>
              <p>최근 30일 활성 사용자</p>
              <strong>{formatNumber(data.overview.monthlyActiveUsers)}</strong>
              <span>명</span>
            </article>
            <article className={styles.heroSecondary}>
              <p>활성 계정</p>
              <strong>{formatNumber(data.overview.activeAccounts)}</strong>
              <span>명</span>
            </article>
            <article className={styles.heroSecondary}>
              <p>저장된 단어</p>
              <strong>{formatNumber(data.overview.totalSavedWords)}</strong>
              <span>개</span>
            </article>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>OVERVIEW</p>
                <h3>운영 요약</h3>
              </div>
              <p>현재 DB와 최근 활동 기준</p>
            </div>
            <div className={styles.metricGrid}>
              <MetricCard
                label="최근 7일 신규 가입"
                value={data.overview.newSignupsLast7Days}
                suffix="명"
                hint={`가입일 미상 기존 계정 ${formatNumber(data.overview.legacyAccountsWithoutSignupDate)}명`}
              />
              <MetricCard
                label="최근 7일 단어 저장"
                value={data.overview.wordUsersLast7Days}
                suffix="명"
                hint="단어를 하나 이상 저장한 사용자"
              />
              <MetricCard
                label="퀴즈 이용 사용자"
                value={data.overview.quizUsers}
                suffix="명"
                hint="퀴즈 세트 완료 기록 기준"
              />
              <MetricCard
                label="최근 30일 페이지 방문"
                value={data.overview.pageViewsLast30Days}
                suffix="회"
                hint={`누적 ${formatNumber(data.overview.totalPageViews)}회`}
              />
              <MetricCard
                label="최근 30일 AI 요청"
                value={data.overview.aiGenerationRequestsLast30Days}
                suffix="회"
                hint={`누적 ${formatNumber(data.overview.totalAiGenerationRequests)}회`}
              />
              <MetricCard
                label="계정당 평균 단어"
                value={data.overview.averageWordsPerActiveAccount}
                suffix="개"
                hint="활성 계정 기준"
              />
              <MetricCard
                label="전체 계정 기록"
                value={data.overview.totalAccounts}
                suffix="명"
                hint={`활성 ${formatNumber(data.overview.activeAccounts)} · 탈퇴 ${formatNumber(data.overview.withdrawnAccounts)}`}
              />
              <MetricCard
                label="누적 탈퇴"
                value={data.overview.totalWithdrawals}
                suffix="회"
                hint="V5 적용 이후 기록"
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>LAST 7 DAYS</p>
                <h3>일별 활동 흐름</h3>
              </div>
              <div className={styles.legend}>
                <span><i className={styles.legendActive} />활성 사용자</span>
                <span><i className={styles.legendViews} />페이지 방문</span>
              </div>
            </div>
            <div className={styles.trendCard}>
              {data.daily.map((item) => (
                <div className={styles.trendRow} key={item.date}>
                  <span className={styles.trendDate}>{formatDay(item.date)}</span>
                  <div className={styles.trendBars}>
                    <div className={styles.barTrack}>
                      <span
                        className={styles.barActive}
                        style={{ width: `${(item.activeUsers / trendMax.activeUsers) * 100}%` }}
                      />
                    </div>
                    <div className={styles.barTrack}>
                      <span
                        className={styles.barViews}
                        style={{ width: `${(item.pageViews / trendMax.pageViews) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={styles.trendValues}>
                    {item.activeUsers}명 · {item.pageViews}회
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.splitSection}>
            <article className={styles.listCard}>
              <div className={styles.cardHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>POPULAR WORDS</p>
                  <h3>많이 저장된 단어</h3>
                </div>
                <span>상위 5개</span>
              </div>
              {data.popularWords.length === 0 ? (
                <EmptyList>저장된 단어가 없습니다.</EmptyList>
              ) : (
                <ol className={styles.rankingList}>
                  {data.popularWords.map((item, index) => (
                    <li key={item.term}>
                      <span className={styles.rank}>{index + 1}</span>
                      <strong>{item.term}</strong>
                      <span>{item.userCount}명 · {item.savedCount}회</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>

            <article className={styles.listCard}>
              <div className={styles.cardHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>POPULAR PAGES</p>
                  <h3>자주 방문한 화면</h3>
                </div>
                <span>최근 30일</span>
              </div>
              {data.popularPages.length === 0 ? (
                <EmptyList>페이지 방문 기록이 없습니다.</EmptyList>
              ) : (
                <ol className={styles.rankingList}>
                  {data.popularPages.map((item, index) => (
                    <li key={item.path}>
                      <span className={styles.rank}>{index + 1}</span>
                      <strong>{pageLabel(item.path)}</strong>
                      <span>{item.userCount}명 · {item.viewCount}회</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>LAST 6 MONTHS</p>
                <h3>월별 서비스 흐름</h3>
              </div>
              <p>가입 · 활동 · 방문 · AI</p>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>월</th>
                    <th>신규 가입</th>
                    <th>활성 사용자</th>
                    <th>페이지 방문</th>
                    <th>AI 요청</th>
                    <th>탈퇴</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly.map((item) => (
                    <tr key={item.month}>
                      <td><strong>{formatMonth(item.month)}</strong></td>
                      <td>{formatNumber(item.newSignups)}</td>
                      <td>{formatNumber(item.activeUsers)}</td>
                      <td>{formatNumber(item.pageViews)}</td>
                      <td>{formatNumber(item.aiGenerationRequests)}</td>
                      <td>{formatNumber(item.withdrawals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>USERS</p>
                <h3>사용자 현황</h3>
              </div>
              <p>{formatNumber(data.users.length)}명 표시</p>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>권한</th>
                    <th>상태</th>
                    <th>가입일</th>
                    <th>최근 로그인</th>
                    <th>최근 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <strong>{user.displayName}</strong>
                        <small>{user.username}</small>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${user.role === "ADMIN" ? styles.adminRole : ""}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${user.status === "ACTIVE" ? styles.activeStatus : styles.withdrawnStatus}`}>
                          {user.status === "ACTIVE" ? "활성" : "탈퇴"}
                        </span>
                      </td>
                      <td>{user.createdAt ? formatDateTime(user.createdAt) : "기존 계정"}</td>
                      <td>{formatDateTime(user.lastLoginAt)}</td>
                      <td>{formatDateTime(user.lastActiveAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>ACCOUNT HISTORY</p>
                <h3>가입·탈퇴 이력</h3>
              </div>
              <p>최근 {formatNumber(data.lifecycle.length)}건</p>
            </div>
            {data.lifecycle.length === 0 ? (
              <div className={styles.historyCard}>
                <EmptyList>V5 적용 이후 가입·탈퇴 이력이 없습니다.</EmptyList>
              </div>
            ) : (
              <ul className={styles.historyCard}>
                {data.lifecycle.map((event) => (
                  <li key={event.eventId}>
                    <span className={`${styles.eventDot} ${event.eventType === "WITHDRAWAL" ? styles.withdrawalDot : ""}`} />
                    <div>
                      <strong>{event.username ?? "삭제된 계정"}</strong>
                      <span>{event.eventType === "SIGNUP" ? "회원가입" : "회원 탈퇴"}</span>
                    </div>
                    <time>{formatDateTime(event.occurredAt)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}
