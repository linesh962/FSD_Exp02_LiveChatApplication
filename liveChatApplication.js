"use strict";

/* ---------- Data ---------- */
const contacts = [
  {
    id: "yatharth",
    name: "Yatharj Bajare",
    color: "#1d6b5a",
    online: true,
    replies: [
      "Hi! How can I help you today?",
      "Sure, let me check that.",
      "Got it, thanks for the update.",
      "That sounds good to me.",
    ],
  },
  {
    id: "Karthi",
    name: "Karthi Devendra",
    color: "#7a4fb5",
    online: true,
    replies: [
      "Did you push the latest code?",
      "I'll review it in an hour.",
      "Can we sync after lunch?",
      "Nice work on that.",
    ],
  },
  {
    id: "support",
    name: "Support Team",
    color: "#c4562b",
    online: false,
    replies: [
      "Thanks for contacting support.",
      "We are looking into your request.",
      "Is there anything else we can do?",
    ],
  },
  {
    id: "sarvesh",
    name: "Sarvesh Shelke",
    color: "#2c6fbb",
    online: true,
    replies: [
      "Interview prep tomorrow?",
      "I found a good DSA problem set.",
      "Let's practice together.",
    ],
  },
];

const STORAGE_KEY = "live-chat-demo";

/* ---------- State ---------- */
let messages = load(); // { contactId: [{ from, text, time }] }
let unread = {}; // { contactId: count }
let activeId = null;
let typingTimer = null;

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const appEl = $("app"),
  listEl = $("contactList"),
  msgsEl = $("messages");
const inputEl = $("input"),
  sendBtn = $("sendBtn"),
  formEl = $("composer");
const searchEl = $("search");

/* ---------- Helpers ---------- */
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}
function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent keeps user input safe from HTML injection
  return node;
}
function makeAvatar(c) {
  const a = el("div", "avatar" + (c.online ? " online" : ""), initials(c.name));
  a.style.background = c.color;
  return a;
}
function lastMessage(id) {
  const list = messages[id] || [];
  return list[list.length - 1];
}

/* ---------- Rendering ---------- */
function renderContacts() {
  const q = searchEl.value.trim().toLowerCase();
  listEl.replaceChildren();

  contacts
    .filter((c) => c.name.toLowerCase().includes(q))
    .forEach((c) => {
      const li = el("li");
      const btn = el(
        "button",
        "contact" + (c.id === activeId ? " active" : ""),
      );
      btn.type = "button";
      btn.addEventListener("click", () => openChat(c.id));

      const last = lastMessage(c.id);
      const body = el("div", "contact-body");
      const top = el("div", "contact-top");
      top.append(
        el("strong", "", c.name),
        el("time", "", last ? fmtTime(last.time) : ""),
      );
      body.append(
        top,
        el("p", "contact-preview", last ? last.text : "No messages yet"),
      );

      btn.append(makeAvatar(c), body);
      if (unread[c.id]) btn.append(el("span", "badge", unread[c.id]));

      li.append(btn);
      listEl.append(li);
    });
}

function renderMessages() {
  msgsEl.replaceChildren();
  const list = messages[activeId] || [];

  if (!list.length) {
    msgsEl.append(el("p", "empty", "No messages yet. Say hello below."));
    return;
  }
  list.forEach(appendBubble);
  scrollToBottom();
}

function appendBubble(m) {
  const bubble = el(
    "div",
    "msg " + (m.from === "me" ? "mine" : "theirs"),
    m.text,
  );
  bubble.append(el("time", "", fmtTime(m.time)));
  msgsEl.append(bubble);
}

function scrollToBottom() {
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function renderHeader() {
  const c = contacts.find((x) => x.id === activeId);
  $("chatName").textContent = c.name;
  $("chatStatus").textContent = c.online ? "Online" : "Offline";
  const avatar = $("chatAvatar");
  avatar.textContent = initials(c.name);
  avatar.style.background = c.color;
  avatar.className = "avatar" + (c.online ? " online" : "");
}

/* ---------- Actions ---------- */
function openChat(id) {
  activeId = id;
  unread[id] = 0;
  removeTyping();
  clearTimeout(typingTimer);
  appEl.classList.add("chat-open");
  renderHeader();
  renderMessages();
  renderContacts();
  inputEl.focus();
}

function addMessage(id, from, text) {
  (messages[id] ||= []).push({ from, text, time: Date.now() });
  save();
  if (id === activeId) {
    const empty = msgsEl.querySelector(".empty");
    if (empty) empty.remove();
    appendBubble(lastMessage(id));
    scrollToBottom();
  } else if (from !== "me") {
    unread[id] = (unread[id] || 0) + 1;
  }
  renderContacts();
}

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || !activeId) return;

  addMessage(activeId, "me", text);
  inputEl.value = "";
  autoGrow();
  sendBtn.disabled = true;
  simulateReply(activeId);
}

function simulateReply(id) {
  const c = contacts.find((x) => x.id === id);
  clearTimeout(typingTimer);
  showTyping();
  typingTimer = setTimeout(
    () => {
      removeTyping();
      const reply = c.replies[Math.floor(Math.random() * c.replies.length)];
      addMessage(id, "them", reply);
    },
    1000 + Math.random() * 1200,
  );
}

function showTyping() {
  if ($("typing")) return;
  const t = el("div", "typing");
  t.id = "typing";
  t.append(el("i"), el("i"), el("i"));
  msgsEl.append(t);
  scrollToBottom();
}
function removeTyping() {
  const t = $("typing");
  if (t) t.remove();
}

function autoGrow() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
}

/* ---------- Event listeners ---------- */
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

inputEl.addEventListener("input", () => {
  sendBtn.disabled = !inputEl.value.trim();
  autoGrow();
});

inputEl.addEventListener("keydown", (e) => {
  // Enter sends, Shift+Enter inserts a new line
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

searchEl.addEventListener("input", renderContacts);

$("backBtn").addEventListener("click", () =>
  appEl.classList.remove("chat-open"),
);

$("clearBtn").addEventListener("click", () => {
  if (!activeId || !confirm("Clear this conversation?")) return;
  messages[activeId] = [];
  save();
  renderMessages();
  renderContacts();
});

/* ---------- Init ---------- */
(function init() {
  // Seed a first message so the demo doesn't start empty
  contacts.forEach((c) => {
    if (!messages[c.id] || !messages[c.id].length) {
      messages[c.id] = [
        { from: "them", text: c.replies[0], time: Date.now() - 60000 },
      ];
    }
  });
  renderContacts();
  activeId = contacts[0].id;
  renderHeader();
  renderMessages();
  renderContacts();
  // On mobile the list shows first; chat-open class is only added after a tap
})();
