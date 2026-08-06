# Alpha Partner — Design System

## Foundation

Интерфейс продолжает визуальную систему «Альфа Будущее» и существующего сайта «Альфа Дело». Это продуктовый диалог, а не dashboard.

## Tokens

- Background: `#ffffff`
- Primary text: `#111111`
- Secondary text: `#565656`
- Alfa red: `#ef3124`
- Future blue: `#0078ff`
- Future purple: `#9933ff`
- Future lime: `#a8ff00`
- Surface: `#f4f4f5`
- Border: `#e5e5e7`
- Font: existing Styrene variable font with system fallback

## Layout

- Reuse the project `Container` with `max-width: 1480px`.
- The main work area is one centered conversation surface.
- Team navigation opens as an overlay side panel; it must not create a permanent multi-column dashboard.
- Desktop chat viewport stays focused and internally scrollable.
- Mobile uses a single column and full-width controls.

## Components

- Large rounded surfaces: 24–32 px radius.
- Buttons: high contrast, 12–16 px radius, minimum 44 px height.
- Primary action: Alfa red or Future blue depending on context.
- Team cards: flat white/surface cards with one strong accent, no gradients or heavy shadows.
- Statuses: plain text plus a restrained color dot; do not surround every datum with a border.
- Agent avatar: reuse `/assets/ai/alfa-agent.png` for Alpha Partner. Specialists use simple role initials/icons with the existing accent palette; no generated imagery.

## Typography

- Page title is large, black, tight tracking, and short enough for two lines at 390 px.
- Chat header and role names use clear semibold/bold hierarchy.
- Body text is at least 14 px mobile and 15–16 px desktop.
- Avoid uppercase except short labels.

## Interaction

- Only the dialogue scrolls during conversation.
- New messages auto-scroll inside the chat.
- Team panel traps attention visually but closes by Escape and overlay click.
- Switching an agent replaces the central conversation; histories never display together.
- Loading uses a short static status and does not fake background work.

## Responsive rules

- No horizontal scrolling at 390, 768, 1024, or 1440 px.
- Team proposal cards: 1 column mobile, 2 columns tablet, responsive 3–5 layout desktop.
- Team side panel becomes full-width below 640 px.
- Header actions wrap or collapse without reducing touch targets.

## Prohibited

- Gradients, glassmorphism, 3D decoration, excessive borders, dense KPI widgets.
- Multiple simultaneous chat columns.
- Tiny labels, clipped inputs, fixed widths that exceed the viewport.
