param
(
    [Parameter(Mandatory=$true, HelpMessage='The file to sign')]
    [string]$File
)

Set-StrictMode -Version latest
$ErrorActionPreference = "Stop"

& "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe" sign /v /sm /s My /a /t http://timestamp.digicert.com /du https://github.com/HorizenOfficial/staketool /n 'Zen Blockchain Foundation' $File

if ($LastExitCode -ne 0)
{
    Exit 1
}

& "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe" sign /v /sm /s My /a /as /fd sha256 /tr http://timestamp.digicert.com /td sha256 /du https://github.com/HorizenOfficial/staketool /n 'Zen Blockchain Foundation' $File

if ($LastExitCode -ne 0)
{
    Exit 1
}
