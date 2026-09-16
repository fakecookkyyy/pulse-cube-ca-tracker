'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Plus,
  Radio,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const contractAddress = '7xKXtg2CW87d97TXNUPcB4Y8qTu9Jfcyf4rrKDjq9H3P';

const starterAccounts = [
  { handle: '@realDonaldTrump', tone: 'from-amber-300 to-orange-500' },
  { handle: '@solana', tone: 'from-violet-400 to-fuchsia-500' },
  { handle: '@pumpdotfun', tone: 'from-emerald-300 to-cyan-500' },
];

const snowflakes = Array.from({ length: 32 }, (_, index) => ({
  delay: `${-((index * 0.79) % 8)}s`,
  duration: `${6.5 + ((index * 1.19) % 5)}s`,
  left: `${(index * 17 + 4) % 100}%`,
  size: `${1 + (index % 3)}px`,
}));

function SnowField() {
  return (
    <div aria-hidden="true" className="snow-field">
      {snowflakes.map((flake, index) => (
        <span
          className="snowflake"
          key={index}
          style={{
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            height: flake.size,
            left: flake.left,
            width: flake.size,
          }}
        />
      ))}
    </div>
  );
}

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
      execute: (input: unknown) => unknown | Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export default function Home() {
  const [accounts, setAccounts] = useState(starterAccounts);
  const [accountInput, setAccountInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const accountsRef = useRef(starterAccounts);

  const watchingText = useMemo(
    () => `${accounts.length.toString().padStart(2, '0')} watched`,
    [accounts.length],
  );

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'get_latest_contract_address',
          title: 'Get latest contract address',
          description: 'Returns the newest detected contract address and its watched X account.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: () => ({
            sourceHandle: '@realDonaldTrump',
            contractAddress,
            copiedByUser: false,
            status: 'preview',
          }),
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'add_x_account_to_watchlist',
          title: 'Add X account to watchlist',
          description: 'Adds one public X handle to the visible local watchlist for contract-address alerts.',
          inputSchema: {
            type: 'object',
            properties: { handle: { type: 'string', description: 'X handle with or without @' } },
            required: ['handle'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input) => {
            if (!input || typeof input !== 'object' || typeof (input as { handle?: unknown }).handle !== 'string') {
              throw new Error('A valid X handle is required.');
            }
            const cleaned = (input as { handle: string }).handle.trim().replace(/^@+/, '');
            if (!cleaned) throw new Error('A valid X handle is required.');

            const handle = `@${cleaned}`;
            if (accountsRef.current.some((account) => account.handle.toLowerCase() === handle.toLowerCase())) {
              return { handle, status: 'already watching', watchlistSize: accountsRef.current.length };
            }

            const next = [...accountsRef.current, { handle, tone: 'from-sky-300 to-blue-500' }];
            accountsRef.current = next;
            setAccounts(next);
            return { handle, status: 'watching', watchlistSize: next.length };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(contractAddress);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = contractAddress;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = accountInput.trim().replace(/^@+/, '');
    if (!trimmed) return;

    const handle = `@${trimmed}`;
    if (!accounts.some((account) => account.handle.toLowerCase() === handle.toLowerCase())) {
      setAccounts((current) => {
        const next = [...current, { handle, tone: 'from-sky-300 to-blue-500' }];
        accountsRef.current = next;
        return next;
      });
    }
    setAccountInput('');
    setShowComposer(false);
  }

  function removeAccount(handle: string) {
    setAccounts((current) => {
      const next = current.filter((account) => account.handle !== handle);
      accountsRef.current = next;
      return next;
    });
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[#050505] px-4 py-6 text-slate-100 sm:grid sm:place-items-center sm:p-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-12rem] top-[-12rem] size-[30rem] rounded-full bg-white/[0.035] blur-[100px]" />
        <div className="absolute bottom-[-16rem] right-[-11rem] size-[32rem] rounded-full bg-emerald-300/[0.055] blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <section className="pulse-cube relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[18px] border border-white/15 bg-[#0a0a0a]/95 shadow-[0_0_0_1px_rgba(255,255,255,0.025),0_32px_90px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <SnowField />
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-white/15 bg-[#111] shadow-[0_0_24px_rgba(127,255,109,0.1)]">
              <Box className="size-5 text-[#89ff76]" strokeWidth={2.1} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[0.86rem] font-bold tracking-[0.08em]">PULSE CUBE</h1>
                <span className="rounded-sm border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  preview
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Radio className="size-2.5 text-[#89ff76] drop-shadow-[0_0_5px_rgba(137,255,118,0.9)]" fill="currentColor" />
                Tracker online · demo feed
              </p>
            </div>
          </div>
          <Button
            aria-label={soundOn ? 'Mute alerts' : 'Enable alert sounds'}
            className="rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white"
            onClick={() => setSoundOn((current) => !current)}
            size="icon-sm"
            variant="ghost"
          >
            {soundOn ? <Volume2 /> : <BellRing />}
          </Button>
        </div>

        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="relative px-5 pb-5 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a3ff92]/85">
              <span className="online-dot size-1.5 rounded-full bg-[#89ff76]" />
              Latest signal
            </p>
            <span className="text-[10px] font-medium text-slate-500">Preview alert</span>
          </div>

          <article className="relative overflow-hidden rounded-[14px] border border-white/[0.12] bg-[#101010]/95 p-4 shadow-[inset_0_1px_rgba(255,255,255,0.045),0_12px_28px_rgba(0,0,0,0.42)]">
            <div className="absolute -right-9 -top-8 size-28 rounded-full bg-[#89ff76]/[0.06] blur-2xl" aria-hidden="true" />
            <div className="relative flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#262626] text-sm font-black text-slate-300 shadow-lg shadow-black/30">
                DT
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-[13px] font-bold">Donald J. Trump</p>
                    <Check className="size-3.5 shrink-0 text-[#89ff76]" strokeWidth={3} />
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">12s ago</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">@realDonaldTrump · new post</p>
                <p className="mt-3 text-[13px] leading-5 text-slate-200">
                  Posted a contract address
                </p>
              </div>
            </div>

            <button
              aria-label="Copy detected contract address"
              className="group relative mt-3 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-left transition hover:border-[#89ff76]/40 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89ff76]"
              onClick={copyAddress}
              type="button"
            >
              <Link2 className="size-4 shrink-0 text-[#89ff76]" />
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium text-slate-200">
                {contractAddress}
              </code>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-slate-300 transition group-hover:bg-[#89ff76] group-hover:text-black">
                {copied ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" />}
              </span>
            </button>

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Button
                className="h-10 rounded-xl bg-[#89ff76] font-bold text-[#07110b] shadow-[0_0_22px_rgba(137,255,118,0.16)] hover:bg-[#b2ffa6]"
                onClick={copyAddress}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? 'Copied for Axiom' : 'Copy CA'}
              </Button>
              <Button
                aria-label="Axiom-ready contract address"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-slate-300 hover:bg-white/[0.1] hover:text-white"
                onClick={copyAddress}
                variant="ghost"
              >
                <ExternalLink />
                <span className="text-xs">Axiom</span>
              </Button>
            </div>
          </article>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-[-0.02em]">Your watchlist</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">{watchingText} · CA-only alerts</p>
            </div>
            <Button
              aria-expanded={showComposer}
              aria-label="Add X account to watchlist"
              className="rounded-xl border border-[#89ff76]/20 bg-[#89ff76]/[0.08] text-[#a3ff92] hover:bg-[#89ff76]/[0.14]"
              onClick={() => setShowComposer((current) => !current)}
              size="icon-sm"
              variant="ghost"
            >
              <Plus />
            </Button>
          </div>

          {showComposer && (
            <form className="mt-3 flex gap-2" onSubmit={addAccount}>
              <Input
                aria-label="X account handle"
                autoFocus
                className="h-9 rounded-xl border-white/10 bg-black/70 text-sm text-white placeholder:text-slate-600 focus-visible:border-[#89ff76]/70"
                onChange={(event) => setAccountInput(event.target.value)}
                placeholder="Add @handle"
                value={accountInput}
              />
              <Button className="h-9 rounded-xl bg-[#89ff76] px-3 font-semibold text-[#07110b] hover:bg-[#b2ffa6]" type="submit">
                Add
              </Button>
            </form>
          )}

          <ul className="mt-3 space-y-1.5" aria-label="Accounts being watched">
            {accounts.map((account) => (
              <li
                className="group flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 transition hover:bg-white/[0.06]"
                key={account.handle}
              >
                <span className="size-7 shrink-0 rounded-lg border border-white/10 bg-[linear-gradient(135deg,#3e3e3e,#151515)]" />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-200">{account.handle}</span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#a3ff92]">
                  <Eye className="size-3" />
                  on
                </span>
                <button
                  aria-label={`Stop watching ${account.handle}`}
                  className="grid size-6 place-items-center rounded-lg text-slate-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={() => removeAccount(account.handle)}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-white/[0.06] text-[#a3ff92]">
                <BellRing className="size-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold">Instant alerts</p>
                <p className="text-[10px] text-slate-500">Sound + visual cue</p>
              </div>
            </div>
            <Switch
              aria-label="Toggle instant alerts"
              checked={soundOn}
              className="data-checked:bg-[#89ff76] data-unchecked:bg-slate-700"
              onCheckedChange={setSoundOn}
              size="sm"
            />
          </div>

          <div aria-live="polite" className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500">
            {copied ? (
              <><Check className="size-3 text-[#a3ff92]" /> Contract address copied — paste it in Axiom.</>
            ) : (
              <><CircleAlert className="size-3 text-slate-500" /> Preview data · connect an approved X source for live alerts.</>
            )}
          </div>
        </div>
      </section>

      <div className="relative mx-auto mt-5 flex max-w-[420px] items-center justify-center gap-1.5 text-[11px] text-slate-500 sm:absolute sm:bottom-7 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2">
        <Sparkles className="size-3 text-[#89ff76]" />
        monitor online · instant copy
        <ChevronRight className="size-3" />
      </div>
    </main>
  );
}
