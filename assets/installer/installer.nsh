!include nsDialogs.nsh
!include WinMessages.nsh
!include LogicLib.nsh

!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to Quartic Pulse"
!define MUI_WELCOMEPAGE_TEXT "Install Quartic Pulse, the Tempest Mainframe audio-reactive fractal visualizer and music-to-video exporter.$\r$\n$\r$\nSetup will let you choose exactly where the program is installed."
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose the folder where Quartic Pulse will be installed. Use Browse to select another drive or location, then choose Next."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Installation folder"
!define MUI_FINISHPAGE_TITLE "Quartic Pulse is ready"
!define MUI_FINISHPAGE_TEXT "Setup has finished installing Quartic Pulse on your computer."

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customHeader
  Caption "Quartic Pulse Setup"
  BrandingText "Tempest Mainframe  •  Quartic Pulse"
!macroend

!macro customPageAfterChangeDir
  Page custom QuarticReadyPage

  Function QuarticReadyPage
    !insertmacro MUI_HEADER_TEXT "Ready to install" "Confirm the selected Quartic Pulse location"
    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ${NSD_CreateLabel} 0 4u 100% 20u "Quartic Pulse will be installed in:"
    Pop $1
    CreateFont $2 "Segoe UI" 9 700
    SendMessage $1 ${WM_SETFONT} $2 1

    ${NSD_CreateText} 0 28u 100% 18u "$INSTDIR"
    Pop $1
    SendMessage $1 ${EM_SETREADONLY} 1 0

    ${NSD_CreateLabel} 0 58u 100% 34u "Choose Back to change the folder, or Install to begin. Shortcuts can be created for the desktop and Start menu."
    Pop $1

    GetDlgItem $1 $HWNDPARENT 1
    SendMessage $1 ${WM_SETTEXT} 0 "STR:Install"
    nsDialogs::Show
  FunctionEnd
!macroend
