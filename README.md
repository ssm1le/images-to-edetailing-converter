## Global Install

> Clone repository

	npm i
	npm link

<b>Command:</b> 

	cob [path to presentation] -s [path to screens]

<b>Config:</b>

> masterPresentationSSH - master presentation ssh key

	{
		"masterPresentationSSH": "git@git.qapint.com:m.molodetskiy/cobalt-template.git"
	}


<b>Arguments:</b>

> path to presentation (empty folder)

> Path to folder with screens (can be `png` or `jpg`): *./screens* - by default

<b>After finishing of presentation creation we need to run command 'co i && co debug' in the created presentation</b>