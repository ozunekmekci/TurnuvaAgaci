'use client';

import React, { useMemo, useState } from 'react';
import { RefreshCw, Share2, Sparkles, X, Copy, Check, ExternalLink } from 'lucide-react';
import { RealMatch } from '../lib/bracket/types';
import { resolveBracket } from '../lib/bracket/resolve';
import { useUserPicks } from '../lib/url-state/useUserPicks';
import { BracketLayout } from './bracket-layout';
import rawTournamentData from '../../data/tournament-data.json';

const realData = rawTournamentData as RealMatch[];

export const BracketContainer: React.FC = () => {
  const { userPicks, updatePick, resetPicks, isUpdating } = useUserPicks(realData);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memoize resolved matches to avoid recalculating on every render
  const resolvedMatches = useMemo(() => {
    return resolveBracket(realData, userPicks);
  }, [userPicks]);

  // Statistics calculation
  const totalMatchesCount = resolvedMatches.length; // Should be 32
  const completedPicksCount = useMemo(() => {
    return resolvedMatches.filter((m) => m.userPick !== null).length;
  }, [resolvedMatches]);

  const completionPercentage = Math.round((completedPicksCount / totalMatchesCount) * 100);

  // Check if champion is determined
  const finalMatch = resolvedMatches.find((m) => m.matchId === 'F-1');
  const champion = finalMatch?.userPick;

  // Check if there are any invalidated picks (picks in rawUserPicks that resolved to null)
  const hasInvalidatedPicks = useMemo(() => {
    return resolvedMatches.some((m) => {
      const rawPick = userPicks[m.matchId];
      return !!rawPick && !m.userPick && m.selectableTeams.length === 2;
    });
  }, [resolvedMatches, userPicks]);

  // Sütun bazlı yuvarlama sayıları ve ilerlemeler
  const roundStats = useMemo(() => {
    const r32 = resolvedMatches.filter((m) => m.matchId.startsWith('R32-'));
    const r16 = resolvedMatches.filter((m) => m.matchId.startsWith('R16-'));
    const qf = resolvedMatches.filter((m) => m.matchId.startsWith('QF-'));
    const sf = resolvedMatches.filter((m) => m.matchId.startsWith('SF-'));
    const finals = resolvedMatches.filter((m) => m.matchId === 'F-1' || m.matchId === '3RD-1');

    return {
      r32: { completed: r32.filter((m) => m.userPick !== null).length, total: r32.length },
      r16: { completed: r16.filter((m) => m.userPick !== null).length, total: r16.length },
      qf: { completed: qf.filter((m) => m.userPick !== null).length, total: qf.length },
      sf: { completed: sf.filter((m) => m.userPick !== null).length, total: sf.length },
      finals: { completed: finals.filter((m) => m.userPick !== null).length, total: finals.length },
    };
  }, [resolvedMatches]);

  // Handle Share Actions
  const handleShareClick = async () => {
    const shareUrl = window.location.href;
    const championName = champion ? champion.name : 'Belirlenmedi';
    const text = `2026 FIFA Dünya Kupası tahminlerimi tamamladım! Şampiyonum: ${championName} 🏆 Seninki hangisi? Buradan tahminini oluştur:`;

    // 1. Try mobile native share first (Web Share API)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dünya Kupası Tahminlerim',
          text: text,
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.warn('Native share failed or dismissed, falling back to modal:', error);
      }
    }

    // 2. Fallback to custom sharing modal
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll to column on mobile
  const scrollToColumn = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Build Social links
  const pParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('p') || '' : '';
  const shareText = `2026 FIFA Dünya Kupası tahminlerimi tamamladım! Şampiyonum: ${champion ? champion.name : ''} 🏆 Seninki hangisi?`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + (typeof window !== 'undefined' ? window.location.href : ''))}`;
  const ogImageUrl = `/api/og?p=${pParam}`;

  return (
    <div className="w-full max-w-full overflow-hidden flex flex-col items-center">
      {/* Top dashboard controls */}
      <div className="w-full max-w-6xl px-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
        
        {/* Progress Section */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <div className="flex justify-between md:justify-start items-center gap-3">
            <span className="text-sm font-semibold text-slate-400">Tahmin İlerlemesi:</span>
            <span className="text-sm font-extrabold text-amber-400">
              {completedPicksCount} / {totalMatchesCount} Maç
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full md:w-64 h-2 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800/40">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Invalidated Picks Notification */}
        {hasInvalidatedPicks && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs font-semibold animate-pulse">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Gerçek maç sonuçları nedeniyle bazı tahminleriniz geçersiz kalmıştır. Lütfen güncelleyin.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Reset Button */}
          <button
            type="button"
            onClick={resetPicks}
            disabled={completedPicksCount === 0 || isUpdating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 transition-all text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 disabled:active:scale-100"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sıfırla</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShareClick}
            disabled={completedPicksCount === 0 || isUpdating}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:active:scale-100
              ${
                completedPicksCount > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Share2 className="w-4 h-4" />
            <span>Tahminleri Paylaş</span>
          </button>
        </div>

      </div>

      {/* Round Quick Navigation Breadcrumb (Especially for Mobile UX) */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-6 px-4">
        {renderNavButton('SON 32', roundStats.r32, () => scrollToColumn('col-left-r32'))}
        {renderNavButton('SON 16', roundStats.r16, () => scrollToColumn('col-left-r16'))}
        {renderNavButton('ÇEYREK FİNAL', roundStats.qf, () => scrollToColumn('col-left-qf'))}
        {renderNavButton('YARI FİNAL', roundStats.sf, () => scrollToColumn('col-left-sf'))}
        {renderNavButton('FİNAL', roundStats.finals, () => scrollToColumn('col-center'))}
      </div>

      {/* Symmetrical Bracket Render */}
      <div className="w-full max-w-full overflow-hidden bg-slate-950/40 rounded-3xl border border-slate-800/80 p-4 shadow-2xl backdrop-blur-sm">
        <BracketLayout
          resolvedMatches={resolvedMatches}
          rawUserPicks={userPicks}
          onPickMatch={updatePick}
        />
      </div>

      {/* Sharing Modal (Desktop / Fallback) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <span>Tahminlerini Paylaş</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link Copy Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Tahmin Paylaşım Linki</span>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 pl-4">
                <span className="text-xs text-slate-400 truncate flex-1">
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#000000] hover:bg-[#1a1a1a] border border-slate-800 text-xs font-bold text-white transition-all text-center"
              >
                <span>X / Twitter</span>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/30 text-xs font-bold text-[#25d366] transition-all text-center"
              >
                <span>WhatsApp</span>
              </a>
            </div>

            {/* IG / Image Sharing Section */}
            <div className="flex flex-col gap-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 mt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-300">Instagram & Görsel Paylaşımı</span>
                <span className="text-[10px] text-slate-500">
                  Instagram hikayende paylaşmak veya kaydetmek için özet PNG görselini açıp indirebilirsin.
                </span>
              </div>
              <a
                href={ogImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] text-xs font-extrabold transition-all text-center"
              >
                <span>Önizleme Görselini Aç</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for round navigation button
function renderNavButton(
  label: string,
  stat: { completed: number; total: number },
  onClick: () => void
) {
  const isCompleted = stat.completed === stat.total;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] md:text-xs font-bold transition-all cursor-pointer active:scale-95
        ${
          isCompleted
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : stat.completed > 0
            ? 'bg-amber-500/5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
            : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
        }
      `}
    >
      {isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
      <span>{label}</span>
      <span className={`text-[9px] px-1 rounded-md py-0.2 ml-0.5
        ${isCompleted ? 'bg-emerald-500/15' : 'bg-slate-950/60'}
      `}>
        {stat.completed}/{stat.total}
      </span>
    </button>
  );
}
