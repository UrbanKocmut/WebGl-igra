Igro se lahko zažene z odkrtjem datoteke "Index.html" v brskalniku.
Po koncu igre se stran zapre ali pa osveži s pritiskom na gumb "F5".

Priporoèen brskalnik je Chrome. Zaradi varnostnih omejitev se lahko uporabi Firefox, ali pa se spremenijo nastavitve:
"""
Chrome

Close all running Chrome instances first. The important word here is 'all'.

On Windows, you may check for Chrome instances using the Windows Task Manager. Alternatively, if you see a Chrome icon in the system tray, then you may open its context menu and click 'Exit'. This should close all Chrome instances.

Then start the Chrome executable with a command line flag:

chrome --allow-file-access-from-files
On Windows, probably the easiest is probably to create a special shortcut icon which has added the flag given above (right-click on shortcut -> properties -> target).

On Mac OSX, you can do this with

open /Applications/Google\ Chrome.app --args --allow-file-access-from-files

"""

Pri uporabi Firefox-a je portebno dovoliti uporabo kursorja.