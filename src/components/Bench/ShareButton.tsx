'use client';

import { useEffect, useState } from 'react';
import { getFriendsForSharing, shareBenchWithFriend } from '@/lib/actions/share';

interface FriendOption {
  id: string;
  username: string;
  avatar_url: string | null;
}

export function ShareButton({ benchId, benchName }: { benchId: string; benchName: string }) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<FriendOption[] | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(`${window.location.origin}/bench/${benchId}`);
  }, [benchId]);

  useEffect(() => {
    if (open && friends === null) {
      getFriendsForSharing().then((data) => setFriends(data as unknown as FriendOption[]));
    }
  }, [open, friends]);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: benchName, text: `Se denne bænk på TourDeBænk: ${benchName}`, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed, fall through to sheet
      }
    }
    setOpen(true);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareWithFriend(friendId: string) {
    await shareBenchWithFriend(benchId, friendId);
    setSentTo((prev) => new Set(prev).add(friendId));
  }

  const message = encodeURIComponent(`Se denne bænk på TourDeBænk: ${benchName} ${shareUrl}`);

  return (
    <>
      <button
        onClick={handleNativeShare}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-moss-600 shadow-card active:scale-90"
        aria-label="Del bænk"
      >
        📤
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="safe-bottom w-full rounded-t-3xl bg-white p-5 shadow-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-moss-900">Del {benchName}</h3>

            {friends && friends.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-moss-700">Del med venner</p>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleShareWithFriend(f.id)}
                      disabled={sentTo.has(f.id)}
                      className="flex items-center justify-between rounded-xl bg-moss-50 px-3 py-2 text-sm"
                    >
                      <span>@{f.username}</span>
                      <span className="text-xs font-semibold text-moss-500">
                        {sentTo.has(f.id) ? 'Sendt ✓' : 'Send'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-2 text-sm font-semibold text-moss-700">Del et link</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <a href={`sms:?body=${message}`} className="rounded-xl bg-moss-50 py-3">
                💬<br />SMS
              </a>
              <a
                href={`https://wa.me/?text=${message}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-moss-50 py-3"
              >
                🟢<br />WhatsApp
              </a>
              <a
                href={`fb-messenger://share?link=${encodeURIComponent(shareUrl)}`}
                className="rounded-xl bg-moss-50 py-3"
              >
                💬<br />Messenger
              </a>
              <button onClick={handleCopy} className="rounded-xl bg-moss-50 py-3">
                🔗<br />{copied ? 'Kopieret!' : 'Kopiér'}
              </button>
            </div>

            <button onClick={() => setOpen(false)} className="btn-secondary mt-4 w-full">
              Luk
            </button>
          </div>
        </div>
      )}
    </>
  );
}
