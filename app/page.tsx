'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const contractAddress = '7xKXtg2CW87d97TXNUPcB4Y8qTu9Jfcyf4rrKDjq9H3P';

type ContractSignal = {
  address: string;
  id: string;
  name: string;
  postText: string;
  postedAt: string;
  source: string;
  time: string;
};

type WatchAccount = {
  handle: string;
  tone: string;
};

const initialSignals: ContractSignal[] = [
  {
    address: contractAddress,
    id: 'preview-latest',
    name: 'Donald J. Trump',
    postText: 'Preview record — a detected contract address would appear here.',
    postedAt: 'Today · September 16, 2026',
    source: '@realDonaldTrump',
    time: '12s ago',
  },
  {
    address: '8ZB8tB9hYQvxsoMRBiovEAayE2Lw32C4NRNTpYybbZkC',
    id: 'preview-earlier-one',
    name: 'Archived preview',
    postText: 'Archived contract alert — select this card to review its captured post.',
    postedAt: 'October 14, 2025',
    source: '@realDonaldTrump',
    time: 'Oct 14, 2025',
  },
  {
    address: '4PDBcTN8mYscA66acWDZUGSvwjfFjm6mmTLrUQHXd4K2',
    id: 'preview-earlier-two',
    name: 'Preview watchlist',
    postText: 'Earlier contract alert — a live source would retain the account, time, and post text.',
    postedAt: 'Today · September 16, 2026',
    source: '@pumpdotfun',
    time: '9m ago',
  },
];

const starterAccounts: WatchAccount[] = [
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
  const [contractInput, setContractInput] = useState('');
  const [contractError, setContractError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<ContractSignal | null>(null);
  const [signals, setSignals] = useState(initialSignals);
  const [soundOn, setSoundOn] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const accountsRef = useRef(starterAccounts);
  const signalsRef = useRef(initialSignals);

  const latestSignal = signals[0];
  const previousSignals = signals.slice(1);

  const watchingText = useMemo(
    () => `${accounts.length.toString().padStart(2, '0')} watched`,
    [accounts.length],
  );

  useEffect(() => {
    try {
      const storedSignals = JSON.parse(window.localStorage.getItem('pulse-cube-contract-history') ?? 'null');
      if (Array.isArray(storedSignals)) {
        const restoredSignals = storedSignals
          .filter((signal): signal is ContractSignal => (
            typeof signal?.address === 'string'
            && isSolanaAddress(signal.address)
            && typeof signal.id === 'string'
            && typeof signal.name === 'string'
            && typeof signal.postText === 'string'
            && typeof signal.postedAt === 'string'
            && typeof signal.source === 'string'
            && typeof signal.time === 'string'
          ))
          .slice(0, 100);
        if (restoredSignals.length) {
          signalsRef.current = restoredSignals;
          setSignals(restoredSignals);
        }
      }

      const storedAccounts = JSON.parse(window.localStorage.getItem('pulse-cube-watchlist') ?? 'null');
      if (Array.isArray(storedAccounts)) {
        const restoredAccounts = storedAccounts
          .filter((account): account is WatchAccount => typeof account?.handle === 'string' && /^@[A-Za-z0-9_]{1,15}$/.test(account.handle))
          .slice(0, 100)
          .map((account) => ({ handle: account.handle, tone: 'from-sky-300 to-blue-500' }));
        if (restoredAccounts.length) {
          accountsRef.current = restoredAccounts;
          setAccounts(restoredAccounts);
        }
      }
    } catch {
      // Keep the preview defaults if saved browser data is invalid or unavailable.
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    window.localStorage.setItem('pulse-cube-contract-history', JSON.stringify(signals.slice(0, 100)));
  }, [historyReady, signals]);

  useEffect(() => {
    if (!historyReady) return;
    window.localStorage.setItem('pulse-cube-watchlist', JSON.stringify(accounts.slice(0, 100)));
  }, [accounts, historyReady]);

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
          execute: () => {
            const latest = signalsRef.current[0];
            return {
              sourceHandle: latest.source,
              contractAddress: latest.address,
              observedAt: latest.postedAt,
              status: 'preview',
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'import_x_handles_to_watchlist',
          title: 'Import X handles to watchlist',
          description: 'Imports a plain list of public X handles into the visible local watchlist. Encrypted J7 backups must be decrypted by J7 before import.',
          inputSchema: {
            type: 'object',
            properties: {
              handles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Public X handles, each with or without @',
              },
            },
            required: ['handles'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input) => {
            if (!input || typeof input !== 'object' || !Array.isArray((input as { handles?: unknown }).handles)) {
              throw new Error('A list of public X handles is required.');
            }
            const handles = (input as { handles: unknown[] }).handles;
            if (!handles.every((handle) => typeof handle === 'string')) {
              throw new Error('Every imported handle must be text.');
            }
            const result = importHandles(handles as string[]);
            if (!result.requested) throw new Error('Provide at least one valid X handle.');
            return { ...result, status: 'imported locally' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);

    void Promise.resolve(
      context.registerTool(
        {
          name: 'record_contract_alert',
          title: 'Record contract alert',
          description: 'Adds a detected Solana contract address to the visible alert log as the newest signal.',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Solana contract address' },
              sourceHandle: { type: 'string', description: 'Optional watched X handle' },
            },
            required: ['address'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (input) => {
            if (!input || typeof input !== 'object' || typeof (input as { address?: unknown }).address !== 'string') {
              throw new Error('A valid Solana contract address is required.');
            }
            const address = (input as { address: string }).address.trim();
            if (!isSolanaAddress(address)) throw new Error('A valid Solana contract address is required.');
            const source = typeof (input as { sourceHandle?: unknown }).sourceHandle === 'string'
              ? (input as { sourceHandle: string }).sourceHandle.trim() || '@manual_test'
              : '@manual_test';
            const signal = addSignal(address, 'New alert', source.startsWith('@') ? source : `@${source}`);
            return { address: signal.address, sourceHandle: signal.source, observedAt: signal.postedAt, status: 'recorded' };
          },
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

  function isSolanaAddress(value: string) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  }

  function addSignal(address: string, name = 'Manual test', source = '@manual_test') {
    const signal: ContractSignal = {
      address,
      id: `${address}-${Date.now()}`,
      name,
      postText: 'Manual test alert — this record was added to the log just now.',
      postedAt: `Today · ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}`,
      source,
      time: 'now',
    };
    const next = [signal, ...signalsRef.current];
    signalsRef.current = next;
    setSignals(next);
    return signal;
  }

  function addManualSignal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = contractInput.trim();
    if (!isSolanaAddress(address)) {
      setContractError('Paste a valid Solana contract address to test the log.');
      return;
    }
    addSignal(address);
    setContractInput('');
    setContractError('');
  }

  function extractHandles(text: string) {
    const found = [...text.matchAll(/(?:^|[\s,])@([A-Za-z0-9_]{1,15})\b/g)].map((match) => `@${match[1]}`);
    return [...new Map(found.map((handle) => [handle.toLowerCase(), handle])).values()];
  }

  function importHandles(values: string[]) {
    const valid = values
      .map((value) => value.trim().replace(/^@+/, ''))
      .filter((value) => /^[A-Za-z0-9_]{1,15}$/.test(value))
      .map((value) => `@${value}`);
    const unique = [...new Map(valid.map((handle) => [handle.toLowerCase(), handle])).values()];
    const known = new Set(accountsRef.current.map((account) => account.handle.toLowerCase()));
    const added = unique.filter((handle) => !known.has(handle.toLowerCase()));

    if (added.length) {
      const next = [...accountsRef.current, ...added.map((handle) => ({ handle, tone: 'from-sky-300 to-blue-500' }))];
      accountsRef.current = next;
      setAccounts(next);
    }

    return { added: added.length, alreadyWatching: unique.length - added.length, requested: unique.length };
  }

  function importPlaintextHandles() {
    if (/j7tracker-encrypted-backup/i.test(importText)) {
      setImportMessage('Encrypted J7 backup recognized. Its account list stays protected here—export a plain @handle list from J7, then import that list.');
      return;
    }
    const result = importHandles(extractHandles(importText));
    if (!result.requested) {
      setImportMessage('No public @handles found. Paste one @handle per line or separated by commas.');
      return;
    }
    setImportMessage(`${result.added} added · ${result.alreadyWatching} already on your watchlist.`);
    setImportText('');
  }

  async function readJ7Backup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    if (/j7tracker-encrypted-backup/i.test(text)) {
      setImportText('');
      setImportMessage('Encrypted J7 backup recognized. Its account list stays protected here—export a plain @handle list from J7, then import that list.');
      return;
    }

    setImportText(text);
    const count = extractHandles(text).length;
    setImportMessage(count ? `${count} public @handle${count === 1 ? '' : 's'} found. Import when ready.` : 'No public @handles found in that file.');
  }

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = address;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }

    setCopiedAddress(address);
    window.setTimeout(() => setCopiedAddress(null), 1800);
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
                {latestSignal.name === 'Donald J. Trump' ? 'DT' : 'CA'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-[13px] font-bold">{latestSignal.name}</p>
                    <Check className="size-3.5 shrink-0 text-[#89ff76]" strokeWidth={3} />
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">{latestSignal.time}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">{latestSignal.source} · {latestSignal.postedAt}</p>
                <p className="mt-3 text-[13px] leading-5 text-slate-200">
                  {latestSignal.postText}
                </p>
              </div>
            </div>

            <button
              aria-label="Copy detected contract address"
              className="group relative mt-3 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3 py-3 text-left transition hover:border-[#89ff76]/40 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89ff76]"
              onClick={() => copyAddress(latestSignal.address)}
              type="button"
            >
              <Link2 className="size-4 shrink-0 text-[#89ff76]" />
              <code className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium text-slate-200">
                {latestSignal.address}
              </code>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-slate-300 transition group-hover:bg-[#89ff76] group-hover:text-black">
                {copiedAddress === latestSignal.address ? <Check className="size-3.5" strokeWidth={3} /> : <Copy className="size-3.5" />}
              </span>
            </button>

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Button
                className="h-10 rounded-xl bg-[#89ff76] font-bold text-[#07110b] shadow-[0_0_22px_rgba(137,255,118,0.16)] hover:bg-[#b2ffa6]"
                onClick={() => copyAddress(latestSignal.address)}
              >
                {copiedAddress === latestSignal.address ? <Check /> : <Copy />}
                {copiedAddress === latestSignal.address ? 'Copied for Axiom' : 'Copy CA'}
              </Button>
              <Button
                aria-label="Axiom-ready contract address"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-slate-300 hover:bg-white/[0.1] hover:text-white"
                onClick={() => copyAddress(latestSignal.address)}
                variant="ghost"
              >
                <ExternalLink />
                <span className="text-xs">Axiom</span>
              </Button>
            </div>
          </article>

          <form className="mt-3" onSubmit={addManualSignal}>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500" htmlFor="contract-test-input">
                Test a new CA
              </label>
              <span className="text-[10px] text-slate-600">Newest first</span>
            </div>
            <div className="flex gap-2">
              <Input
                aria-describedby={contractError ? 'contract-error' : undefined}
                className="h-9 rounded-xl border-white/10 bg-black/70 font-mono text-xs text-white placeholder:font-sans placeholder:text-slate-600 focus-visible:border-[#89ff76]/70"
                id="contract-test-input"
                onChange={(event) => setContractInput(event.target.value)}
                placeholder="Paste a Solana contract address"
                value={contractInput}
              />
              <Button className="h-9 rounded-xl bg-white/[0.08] px-3 text-xs font-semibold text-[#a3ff92] hover:bg-[#89ff76] hover:text-[#07110b]" type="submit" variant="ghost">
                Log
              </Button>
            </div>
            {contractError && <p className="mt-1.5 text-[10px] text-rose-300" id="contract-error">{contractError}</p>}
          </form>

          <section className="mt-4" aria-labelledby="history-heading">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-[-0.02em]" id="history-heading">Contract history</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">Saved on this device · newest first</p>
              </div>
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-500">{signals.length}</span>
            </div>

            <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1" aria-label="Previous contract alerts">
              {previousSignals.map((signal) => (
                <li className="flex items-stretch gap-1.5" key={signal.id}>
                  <button
                    className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-left transition ${selectedSignal?.id === signal.id ? 'border-[#89ff76]/45 bg-[#89ff76]/[0.08]' : 'border-white/[0.07] bg-black/30 hover:border-white/15 hover:bg-white/[0.045]'}`}
                    onClick={() => setSelectedSignal(signal)}
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-slate-300">{signal.source}</span>
                      <span className="shrink-0 text-[10px] text-slate-600">{signal.postedAt}</span>
                    </span>
                    <code className="mt-1 block truncate font-mono text-[10px] text-slate-500">{signal.address}</code>
                  </button>
                  <Button
                    aria-label={`Copy historical contract address from ${signal.source}`}
                    className="h-auto min-h-full w-9 rounded-xl border border-white/[0.07] bg-white/[0.03] px-0 text-slate-500 hover:bg-[#89ff76] hover:text-[#07110b]"
                    onClick={() => copyAddress(signal.address)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    {copiedAddress === signal.address ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </li>
              ))}
            </ul>

            {selectedSignal && (
              <article className="mt-2 rounded-xl border border-[#89ff76]/25 bg-[#0b120a]/90 p-3" aria-live="polite">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-[#a3ff92]">Archived post</p>
                  <span className="text-[10px] text-slate-500">{selectedSignal.postedAt}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-200">{selectedSignal.name} · {selectedSignal.source}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-400">{selectedSignal.postText}</p>
              </article>
            )}
          </section>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-[-0.02em]">Your watchlist</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">{watchingText} · CA-only alerts</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                aria-label="Import a J7 Tracker watchlist"
                className="h-8 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.09] hover:text-white"
                onClick={() => setImportOpen(true)}
                variant="ghost"
              >
                Import J7
              </Button>
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
            {copiedAddress ? (
              <><Check className="size-3 text-[#a3ff92]" /> Contract address copied — paste it in Axiom.</>
            ) : (
              <><CircleAlert className="size-3 text-slate-500" /> Preview data · connect an approved X source for live alerts.</>
            )}
          </div>
        </div>

        <Dialog onOpenChange={setImportOpen} open={importOpen}>
          <DialogContent className="border border-white/15 bg-[#101010] p-5 text-slate-100 shadow-[0_28px_80px_rgba(0,0,0,0.7)]">
            <DialogHeader>
              <DialogTitle className="pr-8 text-base font-bold tracking-[-0.02em]">Import from J7 Tracker</DialogTitle>
              <DialogDescription className="text-[12px] leading-5 text-slate-400">
                This stays in your browser. Import a plain list of public X handles to add them to the CA-alert watchlist.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500" htmlFor="j7-backup-file">
                J7 export file
              </label>
              <Input
                accept=".txt,.j7,.backup,text/plain"
                className="h-9 border-white/10 bg-black/55 text-[11px] text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-white/[0.08] file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-slate-200"
                id="j7-backup-file"
                onChange={readJ7Backup}
                type="file"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500" htmlFor="j7-handles-input">
                Plain tracker list
              </label>
              <Textarea
                className="min-h-28 resize-none border-white/10 bg-black/55 font-mono text-xs text-slate-200 placeholder:font-sans placeholder:text-slate-600 focus-visible:border-[#89ff76]/70"
                id="j7-handles-input"
                onChange={(event) => setImportText(event.target.value)}
                placeholder={'@example\n@another_account\n@one_more'}
                value={importText}
              />
              <p className="text-[10px] leading-4 text-slate-500">Encrypted J7 backups are recognized but stay unreadable without J7-compatible decryption.</p>
            </div>

            {importMessage && <p aria-live="polite" className="rounded-lg border border-[#89ff76]/20 bg-[#89ff76]/[0.06] px-2.5 py-2 text-[11px] leading-4 text-[#c7ffbb]">{importMessage}</p>}

            <DialogFooter className="-mx-5 -mb-5 border-white/10 bg-black/20">
              <Button className="rounded-xl bg-[#89ff76] font-semibold text-[#07110b] hover:bg-[#b2ffa6]" onClick={importPlaintextHandles} type="button">
                Import public handles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <div className="relative mx-auto mt-5 flex max-w-[420px] items-center justify-center gap-1.5 text-[11px] text-slate-500 sm:absolute sm:bottom-7 sm:left-1/2 sm:mt-0 sm:-translate-x-1/2">
        <Sparkles className="size-3 text-[#89ff76]" />
        monitor online · instant copy
        <ChevronRight className="size-3" />
      </div>
    </main>
  );
}
