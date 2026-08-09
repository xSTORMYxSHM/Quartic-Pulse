# Contributing to Quartic Pulse

Quartic Pulse is intended to remain free, public, and shareable under GPL-3.0-or-later. Contributions are welcome when the complete distributed feature can legally remain available under those terms.

## Code and dependency policy

- Prefer original project code and platform APIs.
- New libraries, native tools, copied code, fonts, images, audio, shaders, and other assets must have a GPL-3.0-or-later-compatible license for the way Quartic Pulse distributes them.
- Record the component name, author or project, version, original source URL, license, and any required notices in `THIRD_PARTY_NOTICES.md` before distribution.
- Do not add proprietary, noncommercial, no-derivatives, source-unavailable, or unclear-license material to a public build.
- Do not commit paid marketplace assets or content licensed only to one contributor.
- Preserve corresponding-source obligations for GPL and LGPL components, including the exact FFmpeg build used by a release.

## Machine-learning models

Models are reviewed separately from the code that runs them. Before adding or downloading a model, document:

- the model and runtime licenses;
- permission to redistribute the weights;
- commercial-use, attribution, and modification terms;
- any restrictions claimed for training data or generated output;
- the original download and corresponding source or model card.

A feature that cannot satisfy all of these checks must remain an optional user-supplied integration and must not be bundled with Quartic Pulse.

## Assets and branding

Contributors must own their submitted assets or have written permission to distribute and modify them. Quartic Pulse code is GPL-3.0-or-later, while the official Tempest Mainframe, Storm Horizon Media, Storm Horizon Radio, and Quartic Pulse branding follows `BRAND_ASSETS.md`.

## Pull-request checklist

- The change builds and passes the relevant smoke tests.
- Live and deterministic offline rendering behave consistently where applicable.
- Saved profiles remain backward compatible or include an explicit migration.
- New controls have clear names, defaults, help text, reset behavior, and keyboard/touch access.
- Third-party notices and source links are updated when required.
- No credentials, private files, licensed-only assets, or generated build artifacts are committed.
