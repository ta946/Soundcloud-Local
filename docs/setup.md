# [Soundcloud Local](https://github.com/ta946/Soundcloud-Local) - SETUP

in the main page, click on the green `code` button then download zip. then unzip the folder anywhere you want to keep the program.

### Install `node` (to run the local web server to interact with soundcloud)

1. download and install node from the node website
```
https://nodejs.org/en/download/package-manager
```
	1. to test node is setup correctly run the following command in a terminal
	```
	node --version
	npm --version
	```
	2. you should see a version number for node and for npm
	3. if it does not work your installation was unsuccessful or node and/or npm have not been added to your path
2. run the script to install the node dependances
	1. WINDOWS: run `setup_dependancies.bat`
	1. MACOS: run `setup_dependancies.sh`


### Get soundcloud credentials

1. create a copy of `sc_config_template.js` in the `Soundcloud-Local` folder and rename it to `sc_config.js`
1. open `sc_config.js` in your preferred text editor
1. open chrome
1. open chrome's `devtools` by pressing `F12` or right-click in chrome and click `inspect`
1. go to the `network` tab in devtools
1. visit [soundcloud.com](soundcloud.com) (login if you aren't already)
1. go to the [feed](https://soundcloud.com/feed) page
1. enable Filter in network tab by clicking the funnel icon (between the stop and magnifying glass icons)
	an extra row with a small filter icon and input box with Filter written in it should appear
1. in the filter input box, enter the following
	```
	stream?
	```
1. now there should only be one network request in the list. click on that request, it will show the details of the request in a sub-window to the right
1. click on the `Headers` tab in the request details sub-window
1. Scroll all the way down, you should see a sub-section called `Request Headers`
1. under `Request Headers`, find `Authorization`, its value should look like `OAuth 2-123456-123456789-abcdefghijklmn`
1. copy the value of `Authorization` **WITHOUT THE `OAuth` PART**
	```
	2-123456-123456789-abcdefghijklmn
	```
1. in `sc_config.js` that you opened earlier, paste the `Authorization` value without OAuth or any spaces into `oauth_token`
1. click on the `Payload` tab in the request details sub-window
1. find `client_id` and copy the value
1. in `sc_config.js`, paste the `client_id` value without any spaces into `client_id`
1. find `user_urn` it should look like `soundcloud:users:123456789`
1. copy the numbers of `user_urn` **WITHOUT THE `soundcloud:users:`**
	```
	123456789
	```
1. in `sc_config.js`, paste the `user_urn` numbers without any spaces into `user_id`
1. back in the filter input box, replace `stream?` with the following
	```
	tracks?
	```
1. you might have multiple results, click on one that has a symbol next to it that looks like `{;}`, another way to check you selected the right one is in selected requests' subwindow on the right, under the `General` section, the second entry `Request Method` should be `GET` (if you see `OPTIONS` then select a different request)
1. Scroll all the way down, you should see a sub-section called `Request Headers`
1. under `Request Headers`, find `x-datadome-clientid`, its value should look like `AKJSDHalkjdnsaKLJASBDKLJBJaslkjbdLKJBJDSlkjbsakljbjdaLKJBJ`
1. copy the value of `x-datadome-clientid`
1. in `sc_config.js`, paste the `x-datadome-clientid` value without any spaces into `datadome_clientid`
1. save and close `sc_config.js` and chrome
