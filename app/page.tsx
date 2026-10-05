'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  Star,
  Utensils,
  Waves,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type Mood = 'ご飯' | 'リラックス' | 'アクティビティ'

type Visit = {
  id: number
  spotId: number
  date: string
  rating: number
  memo: string
}

type Spot = {
  id: number
  title: string
  area: string
  category: Mood
  stamina: string
  duration: string
  description: string
  access: string
  address: string
  image: string
  map: string
}

// Supabaseが取得できなかった場合のフォールバック
const initialSpots: Spot[] = [
  {
    id: 1,
    title: '千光寺公園',
    area: '尾道',
    category: 'リラックス',
    stamina: '散歩レベル',
    duration: '半日',
    description:
      '尾道の街並みと瀬戸内海を一望できる、気分転換にぴったりの高台の公園。',
    access: 'JR尾道駅からアクセス可能',
    address: '広島県尾道市西土堂町19-1',
    image: '',
    map: '',
  },
  {
    id: 2,
    title: '宮島表参道商店街',
    area: '宮島・廿日市',
    category: 'ご飯',
    stamina: '散歩レベル',
    duration: '1時間以内',
    description:
      '宮島名物のグルメやお土産探しを楽しめる商店街。',
    access: '宮島桟橋から徒歩約5分',
    address: '広島県廿日市市宮島町',
    image: '',
    map: '',
  },
  {
    id: 3,
    title: '瀬戸田サンセットビーチ',
    area: '尾道',
    category: 'アクティビティ',
    stamina: '元気',
    duration: '半日',
    description:
      '瀬戸内海の景色を楽しみながらアクティビティを楽しめる海浜公園。',
    access: '生口島西岸・瀬戸内しまなみ海道沿い',
    address: '広島県尾道市瀬戸田町垂水1506番地15',
    image: '',
    map: '',
  },
]

const options = [
  {
    label: 'ご飯',
    icon: Utensils,
    note: 'おいしいものを食べたい',
  },
  {
    label: 'リラックス',
    icon: Waves,
    note: 'ゆっくり過ごしたい',
  },
  {
    label: 'アクティビティ',
    icon: Zap,
    note: '体を動かしたい',
  },
] as const

const areas = [
  '全エリア',
  '広島市',
  '宮島・廿日市',
  '呉・江田島',
  '東広島・西条',
  '竹原・三原',
  '尾道',
  '福山',
  '世羅',
  '三次',
  '庄原',
  '芸北',
]

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [spots, setSpots] = useState<Spot[]>(initialSpots)

  const [mood, setMood] = useState<Mood>('リラックス')
  const [stamina, setStamina] = useState('散歩レベル')
  const [duration, setDuration] = useState('半日')
  const [area, setArea] = useState('全エリア')

  const [view, setView] = useState<
    'home' | 'recommendations' | 'detail' | 'history'
  >('home')

  const [selected, setSelected] = useState<Spot | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [toast, setToast] = useState('')

  // Supabaseからデータ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return

      // ログインユーザー
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)

      // スポット取得
      const { data: spotsData, error: spotsError } = await supabase
        .from('spots')
        .select(`
          id,
          title,
          area,
          category,
          stamina_level,
          duration_level,
          description,
          access,
          address,
          image_url,
          map_url
        `)

      if (spotsError) {
        console.error('spots取得エラー:', spotsError)
      }

      if (spotsData && spotsData.length > 0) {
        const formattedSpots: Spot[] = spotsData.map((spot) => ({
          id: spot.id,
          title: spot.title ?? '',
          area: spot.area ?? '',

          category:
            spot.category === 1
              ? 'リラックス'
              : spot.category === 2
                ? 'ご飯'
                : 'アクティビティ',

          stamina:
            spot.stamina_level === 1
              ? 'ヘトヘト'
              : spot.stamina_level === 2
                ? '散歩レベル'
                : '元気',

          duration:
            spot.duration_level === 1
              ? '1時間以内'
              : spot.duration_level === 2
                ? '半日'
                : '終日',

          description: spot.description ?? '',
          access: spot.access ?? '',
          address: spot.address ?? '',
          image: spot.image_url ?? '',
          map: spot.map_url ?? '',
        }))

        setSpots(formattedSpots)
      }

      // 訪問履歴
      const { data: visitsData, error: visitsError } = await supabase
        .from('visit_logs')
        .select('*')
        .order('visited_at', { ascending: false })

      if (visitsError) {
        console.error('visit_logs取得エラー:', visitsError)
      }

      if (visitsData) {
        setVisits(
          visitsData.map((v) => ({
            id: v.id,
            spotId: v.spots_id,
            date: v.visited_at || '今日',
            rating: v.rating || 0,
            memo: v.memo || '',
          }))
        )
      }
    }

    fetchData()
  }, [])

  // 今は「気分」と「エリア」で絞り込み
  // スポット数を増やしたら体力・時間も条件に追加する
  const recommendations = useMemo(
    () =>
      spots
        .filter(
          (spot) =>
            spot.category === mood &&
            (area === '全エリア' || spot.area === area)
        )
        .slice(0, 3),
    [spots, mood, area]
  )

  const openDetail = (spot: Spot) => {
    setSelected(spot)
    setView('detail')
  }

  const showToast = (message: string) => {
    setToast(message)

    window.setTimeout(() => {
      setToast('')
    }, 2600)
  }

  // 訪問記録
  const visit = async () => {
    if (!selected || !user || !supabase) return

    if (visits.some((item) => item.spotId === selected.id)) {
      return
    }

    const newVisit = {
      user_id: user.id,
      spots_id: selected.id,
      visited_at: new Date().toISOString().split('T')[0],
      rating: 0,
      memo: '',
    }

    const { data, error } = await supabase
      .from('visit_logs')
      .insert([newVisit])
      .select()
      .single()

    if (error) {
      console.error('訪問記録エラー:', error)
      showToast('保存に失敗しました')
      return
    }

    setVisits((current) => [
      {
        id: data.id,
        spotId: data.spots_id,
        date: data.visited_at,
        rating: data.rating,
        memo: data.memo,
      },
      ...current,
    ])

    showToast('訪問を記録しました')
  }

  // レビュー保存・更新
  const handleSaveReview = async (
    rating: number,
    memo: string,
    updating: boolean
  ) => {
    if (!selected || !supabase) return

    const existing = visits.find(
      (item) => item.spotId === selected.id
    )

    if (!existing) {
      showToast('先に「ここに行く」を押してください')
      return
    }

    const { error } = await supabase
      .from('visit_logs')
      .update({
        rating,
        memo,
      })
      .eq('id', existing.id)

    if (error) {
      console.error('レビュー保存エラー:', error)
      showToast('レビューの保存に失敗しました')
      return
    }

    setVisits((items) =>
      items.map((item) =>
        item.spotId === selected.id
          ? {
              ...item,
              rating,
              memo,
            }
          : item
      )
    )

    showToast(
      updating
        ? 'レビューを更新しました'
        : 'レビューを保存しました'
    )
  }

  // 訪問履歴削除
  const handleDeleteVisit = async (id: number) => {
    if (!supabase) return

    const { error } = await supabase
      .from('visit_logs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('削除エラー:', error)
      showToast('削除に失敗しました')
      return
    }

    setVisits((items) =>
      items.filter((item) => item.id !== id)
    )

    showToast('削除しました')
  }

  // ログアウト
  const logout = async () => {
    await supabase?.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) {
    return (
      <div className="p-10 text-center">
        <a
          href="/login"
          className="text-blue-600 underline"
        >
          ログインしてください
        </a>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">

      {/* ヘッダー */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-10">

        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 text-left"
          aria-label="トップへ戻る"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#1769aa] text-white">
            <MapPin
              className="size-5"
              fill="currentColor"
            />
          </span>

          <span>
            <span className="block text-lg font-bold">
              よりみち広島
            </span>

            <span className="block text-[11px] text-slate-500">
              あなたに合う、広島のお出かけ。
            </span>

            {user?.email && (
              <span className="block text-[11px] text-slate-400">
                {user.email}
              </span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('history')}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
          >
            <Heart
              className="size-4 text-orange-500"
              fill="currentColor"
            />
            訪問履歴
          </button>

          <button
            onClick={logout}
            className="rounded-full bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pb-12 md:px-10">

        {/* HOME */}
        {view === 'home' && (
          <section className="mx-auto max-w-3xl pt-10 md:pt-16">

            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-bold tracking-[0.2em] text-[#1769aa]">
                HIROSHIMA DAY OUT
              </p>

              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                今日は、どんな
                <br />
                <span className="text-[#1769aa]">
                  気分
                </span>
                で出かける？
              </h1>

              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-500">
                気分・体力・時間から、あなたにぴったりの場所を
                <br className="hidden sm:block" />
                あえて3つだけご提案します。
              </p>
            </div>

            <div className="flex flex-col gap-7 rounded-[28px] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 md:p-8">

              <Choice
                title="気分"
                value={mood}
                items={options.map((item) => item.label)}
                onChange={(value) =>
                  setMood(value as Mood)
                }
                icons={options.map((item) => item.icon)}
              />

              <Choice
                title="体力レベル"
                value={stamina}
                items={[
                  'ヘトヘト',
                  '散歩レベル',
                  '元気',
                ]}
                onChange={setStamina}
              />

              <Choice
                title="利用時間"
                value={duration}
                items={[
                  '1時間以内',
                  '半日',
                  '終日',
                ]}
                onChange={setDuration}
              />

              <div>
                <label
                  htmlFor="area"
                  className="mb-3 block text-sm font-bold"
                >
                  エリア
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    任意
                  </span>
                </label>

                <select
                  id="area"
                  value={area}
                  onChange={(event) =>
                    setArea(event.target.value)
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1769aa]"
                >
                  {areas.map((item) => (
                    <option key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  setView('recommendations')
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1769aa] py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#12598f]"
              >
                この条件で探す
                <ChevronRight className="size-5" />
              </button>
            </div>
          </section>
        )}

        {/* おすすめ */}
        {view === 'recommendations' && (
          <section className="mx-auto max-w-4xl pt-7">

            <Back
              onClick={() => setView('home')}
            />

            <div className="mb-8 mt-8">
              <p className="text-sm font-bold text-[#1769aa]">
                あなたへのおすすめ
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                今日はここへ行こう。
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {mood}・{stamina}・{duration}・{area}
              </p>
            </div>

            {recommendations.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-3">
                {recommendations.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    onClick={() =>
                      openDetail(spot)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
                <p className="font-bold">
                  条件に合うスポットがありません
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  条件を変更してもう一度探してみてください。
                </p>
              </div>
            )}

            <button
              onClick={() => setView('home')}
              className="mx-auto mt-8 block text-sm font-semibold text-slate-500 underline underline-offset-4"
            >
              条件を変えて探す
            </button>
          </section>
        )}

        {/* 詳細 */}
        {view === 'detail' && selected && (
          <Detail
            spot={selected}
            visits={visits}
            onBack={() =>
              setView('recommendations')
            }
            onVisit={visit}
            onSave={handleSaveReview}
          />
        )}

        {/* 訪問履歴 */}
        {view === 'history' && (
          <section className="mx-auto max-w-3xl pt-7">

            <Back
              onClick={() => setView('home')}
            />

            <div className="mb-8 mt-8">
              <p className="text-sm font-bold text-[#1769aa]">
                YOUR MEMORIES
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                訪問履歴
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                あなたのお出かけの記録です。
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {visits.map((item) => {
                const spot = spots.find(
                  (candidate) =>
                    candidate.id === item.spotId
                )

                if (!spot) return null

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                  >
                    {spot.image ? (
                      <img
                        src={spot.image}
                        alt={spot.title}
                        className="size-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-center text-xs text-slate-400">
                        画像準備中
                      </div>
                    )}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-2">

                        <div>
                          <h2 className="font-bold">
                            {spot.title}
                          </h2>

                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="size-3" />
                            {spot.area} ・ {item.date}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleDeleteVisit(item.id)
                          }
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          削除
                        </button>
                      </div>

                      <Stars
                        value={item.rating}
                        size="small"
                      />

                      {item.memo && (
                        <p className="mt-2 truncate text-xs text-slate-500">
                          {item.memo}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </main>
  )
}

// 詳細画面
function Detail({
  spot,
  visits,
  onBack,
  onVisit,
  onSave,
}: {
  spot: Spot
  visits: Visit[]
  onBack: () => void
  onVisit: () => void
  onSave: (
    rating: number,
    memo: string,
    updating: boolean
  ) => void
}) {
  const existing = visits.find(
    (item) => item.spotId === spot.id
  )

  const [rating, setRating] = useState(
    existing?.rating ?? 0
  )

  const [memo, setMemo] = useState(
    existing?.memo ?? ''
  )

  const [hover, setHover] = useState(0)
  const [error, setError] = useState('')

  const average = existing?.rating
    ? existing.rating.toFixed(1)
    : '4.3'

  const save = () => {
    if (!rating) {
      setError('評価を選択してください')
      return
    }

    setError('')

    onSave(
      rating,
      memo,
      Boolean(existing?.rating)
    )
  }

  // map_urlが未登録なら住所からGoogle Maps検索URLを作る
  const mapUrl =
    spot.map ||
    (spot.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          spot.address
        )}`
      : '')

  return (
    <section className="mx-auto max-w-3xl pt-7">

      <Back onClick={onBack} />

      <article className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">

        {spot.image ? (
          <img
            src={spot.image}
            alt={spot.title}
            className="h-64 w-full object-cover md:h-80"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-slate-100 text-sm text-slate-400 md:h-80">
            画像準備中
          </div>
        )}

        <div className="p-6 md:p-9">

          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="mb-3 flex flex-wrap gap-2">

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1769aa]">
                  {spot.category}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {spot.area}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                {spot.title}
              </h1>
            </div>

            <div className="text-right">
              <Stars
                value={existing?.rating ?? 0}
                size="small"
              />

              {existing?.rating ? (
                <p className="mt-1 text-xs font-medium text-slate-500">
                  <strong className="text-slate-700">
                    {average}
                  </strong>
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  未評価
                </p>
              )}
            </div>
          </div>

          <div className="my-6 flex flex-wrap gap-4 border-y border-slate-100 py-4 text-sm text-slate-600">

            <span className="flex items-center gap-2">
              <Zap className="size-4 text-orange-500" />
              {spot.stamina}
            </span>

            <span className="flex items-center gap-2">
              <Clock3 className="size-4 text-[#1769aa]" />
              {spot.duration}
            </span>
          </div>

          <p className="text-sm leading-8 text-slate-600">
            {spot.description}
          </p>

          {spot.address && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="mb-1 font-bold text-slate-900">
                住所
              </p>
              {spot.address}
            </div>
          )}

          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-1 font-bold text-slate-900">
              アクセス
            </p>
            {spot.access}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">

            <button
              onClick={onVisit}
              disabled={Boolean(existing)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f28b30] py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-default disabled:opacity-60"
            >
              {existing
                ? '訪問済み'
                : 'ここに行く'}

              <Heart
                className="size-5"
                fill="currentColor"
              />
            </button>

            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Google Maps
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">

            <div className="mb-5">
              <p className="text-lg font-bold">
                行ってみた感想を残す
              </p>

              <p className="mt-1 text-sm text-slate-500">
                あなたの記録を保存して、あとから振り返れます。
              </p>
            </div>

            <div className="flex flex-col gap-5">

              <div>
                <p className="mb-3 text-sm font-bold">
                  評価
                </p>

                <div
                  className="flex gap-1"
                  onMouseLeave={() =>
                    setHover(0)
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value}つ星`}
                        onMouseEnter={() =>
                          setHover(value)
                        }
                        onClick={() =>
                          setRating(value)
                        }
                        className="rounded-md p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        <Star
                          className="size-8"
                          fill={
                            (hover || rating) >= value
                              ? '#f59e0b'
                              : 'none'
                          }
                          stroke={
                            (hover || rating) >= value
                              ? '#f59e0b'
                              : '#cbd5e1'
                          }
                        />
                      </button>
                    )
                  )}
                </div>

                {error && (
                  <p
                    className="mt-2 text-sm font-medium text-red-500"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="memo"
                  className="mb-3 block text-sm font-bold"
                >
                  感想・メモ
                </label>

                <textarea
                  id="memo"
                  maxLength={500}
                  value={memo}
                  onChange={(event) =>
                    setMemo(event.target.value)
                  }
                  placeholder={
                    '例：\n景色がとても良かった。\nまた行きたい。'
                  }
                  className="min-h-32 w-full resize-y rounded-2xl border-0 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1769aa]"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {memo.length} / 500
                </p>
              </div>

              <button
                onClick={save}
                className="w-full rounded-2xl bg-[#1769aa] py-4 font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-[#12598f]"
              >
                {existing?.rating
                  ? 'レビューを更新'
                  : 'レビューを保存'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

// 星表示
function Stars({
  value,
  size = 'normal',
}: {
  value: number
  size?: 'small' | 'normal'
}) {
  return (
    <div
      className="flex items-center gap-0.5 text-orange-400"
      aria-label={`${value}つ星`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            size === 'small'
              ? 'size-3.5'
              : 'size-5'
          }
          fill={
            star <= value
              ? 'currentColor'
              : 'none'
          }
        />
      ))}
    </div>
  )
}

// 選択ボタン
function Choice({
  title,
  value,
  items,
  onChange,
  icons,
}: {
  title: string
  value: string
  items: string[]
  onChange: (value: string) => void
  icons?: typeof Utensils[]
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold">
        {title}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => {
          const Icon = icons?.[index]

          return (
            <button
              key={item}
              onClick={() =>
                onChange(item)
              }
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold transition ${
                value === item
                  ? 'bg-blue-50 text-[#1769aa] ring-2 ring-[#1769aa]'
                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {Icon && (
                <Icon className="size-4" />
              )}

              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 戻るボタン
function Back({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#1769aa]"
    >
      <ArrowLeft className="size-4" />
      戻る
    </button>
  )
}

// スポットカード
function SpotCard({
  spot,
  onClick,
}: {
  spot: Spot
  onClick: () => void
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">

      {spot.image ? (
        <img
          src={spot.image}
          alt={spot.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
          画像準備中
        </div>
      )}
git
      <div className="p-5">

        <div className="flex items-center justify-between gap-2">

          <span className="text-xs font-bold text-[#1769aa]">
            {spot.area}
          </span>

          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock3 className="size-3.5" />
            {spot.duration}
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold">
          {spot.title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {spot.stamina} ・ {spot.category}
        </p>

        <button
          onClick={onClick}
          className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1769aa]"
        >
          詳細を見る
          <ChevronRight className="size-4" />
        </button>
      </div>
    </article>
  )
}