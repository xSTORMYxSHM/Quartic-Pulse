# Third-party notices

Quartic Pulse is free software licensed under the GNU General Public License,
version 3 or any later version. Its license is provided in `LICENSE`.

The components below retain their own copyrights, licenses, and trademarks.
Nothing in the Quartic Pulse license changes those terms.

## FFmpeg

Quartic Pulse Windows packages include an unmodified 64-bit FFmpeg command-line
executable for final video encoding and audio/video muxing. The release build is
provided by Gyan Doshi and is licensed under GNU GPL version 3 because GPL
components are enabled.

- Project and source: https://ffmpeg.org/
- Source repository: https://github.com/FFmpeg/FFmpeg
- Windows build distributor: https://www.gyan.dev/ffmpeg/builds/
- Distributor releases: https://github.com/GyanD/codexffmpeg/releases
- GNU GPL version 3: https://www.gnu.org/licenses/gpl-3.0.html
- FFmpeg legal and compliance information: https://ffmpeg.org/legal.html

The packaged `resources/bin/FFmpeg-README.txt` records the exact FFmpeg source
commit, configuration, enabled external libraries, and their versions for the
binary in that package. `resources/bin/FFmpeg-LICENSE.txt` contains its license.
`resources/bin/FFmpeg-SOURCE.txt` gives the corresponding-source instructions
for redistributors.

Quartic Pulse does not claim ownership of FFmpeg. FFmpeg is a trademark of
Fabrice Bellard, originator of the FFmpeg project.

## Electron and Chromium

Quartic Pulse uses Electron 37.10.3, which is distributed under the MIT License.
Electron embeds Chromium and other third-party software distributed under their
respective licenses.

- Electron source: https://github.com/electron/electron
- Electron license: https://github.com/electron/electron/blob/main/LICENSE
- Chromium source: https://chromium.googlesource.com/chromium/src/

The packaged application includes `LICENSE.electron.txt` and
`LICENSES.chromium.html` beside the main executable.

## NAudio

Quartic Pulse uses NAudio 2.2.1 for Windows WASAPI audio-device discovery and
capture. NAudio is distributed under the MIT License.

- NAudio source: https://github.com/naudio/NAudio
- NAudio license: https://github.com/naudio/NAudio/blob/release/2.x/license.txt

The packaged application also contains `NAudio-LICENSE.txt` with the NAudio
assemblies.

## Packaging tools

Electron Builder and NSIS are used to create the Windows installer and portable
package. They are build and packaging tools and retain their respective licenses.

- Electron Builder: https://github.com/electron-userland/electron-builder
- NSIS: https://nsis.sourceforge.io/License

## Project names and artwork

Tempest Mainframe, Storm Horizon Media, Storm Horizon Radio, Quartic Pulse, and
their official names, logos, and identifying artwork are original project or
commissioned brand assets owned by the Quartic Pulse project owner. They are
covered by the separate permissions in `BRAND_ASSETS.md`, not by the GPL grant
for the application source code.
