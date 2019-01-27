var com = (window.com != undefined ? window.com : {});
com.mi = (com.mi != undefined ? com.mi : {});
com.mi.rs = (com.mi.rs != undefined ? com.mi.rs : {});
module.exports = {
	com: com,
	WebSocket: window.WebSocket,
	URL: window.URL,
};
