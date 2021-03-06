module.exports = {
    pageOpenCallback: pageOpenCallback
};

// Define function that will be called when phantom page is done loading
function pageOpenCallback(status) {
	// Get the location of the current page
	var location = genericFunctions.parseURL(page.evaluate(function() {
		return window.location.href;
	}));
				
	// Skip about:.... pages
	if (location.protocol != 'about') {
		
		// Start looking for a content deeplink on the same hostname
		if (configuration.getContentDeeplink && genericFunctions.parseURL(handleURLs.currentURL()).path == '/') {
			var deepLink = page.evaluate(function() {
				links = document.links;
				
				for (x in links) {
					link = links[x];
					dashCount = (link.pathname.match(/\-|_/g) || []).length;
					slashCount = (link.pathname.match(/\//g) || []).length;
					
					if (window.location.hostname == link.hostname && dashCount >= 2 && slashCount >= 2 && link.pathname.length >= 35)
						return link.href;
				}
				return false;
			});
								
			if (deepLink) {
				console.log('    Content deeplink found, adding it to URLs');
				configuration.urls.unshift(deepLink);
			}
		}
		
		// Get all deeplinks on the same hostname
		if (configuration.getAllDeeplinks && genericFunctions.parseURL(handleURLs.currentURL()).path == '/') {
			deepLinks = page.evaluate(function() {
				links = document.links;
				deepLinks = [];
				
				for (x in links) {
					link = links[x];
					
					if (window.location.hostname == link.hostname && link.pathname != '/')
						deepLinks.push(link.href);
				}

				return deepLinks;
			});
								
			if (deepLinks.length > 0) {
				console.log('    Adding 10 random deeplinks URLs');
				genericFunctions.shuffle(deepLinks);
				for (x in deepLinks.slice(0, 10)) {
					configuration.urls.unshift(deepLinks[x]);
				}
			}
		}
			
		// Get banners
		if (configuration.detectBanners) {
			var banners = detectBanners.detectBanners(page);

			// Loop through banners and let phantom take screenshots of them
			for (x in banners) {
				banner = banners[x];
				clipRect = banner.clipRect;
				page.clipRect = clipRect;
				if (Math.sqrt(clipRect.width * clipRect.height) < 750 && clipRect.width > 0 && clipRect.height > 0) {
					// Render banner to png
					//if (banner.parent.length == 0 && systemArguments.norendering != 1)
					//	page.render(outputDir + '/banners/' + encodeURIComponent(banner.id) + '.png');
				}

				// Add banner to list of banners
				exportLists.banners.list.push([
					systemArguments.config, timestamp, location.protocol, location.host, genericFunctions.encloseQuotes(location.path),
					genericFunctions.encloseQuotes(banner.id), genericFunctions.encloseQuotes(banner.parent), genericFunctions.encloseQuotes(encodeURIComponent(banner.id)), genericFunctions.encloseQuotes(banner.description),
					Math.round(clipRect.width), Math.round(clipRect.height), Math.round(clipRect.top), Math.round(clipRect.left)
				].join(delimiter));
			}
		}
		
		// Add cookies to list of cookies
		if (configuration.storeCookies) {
			for (x in phantom.cookies) {
				cookie = phantom.cookies[x];
				cookiePartyInfo = detectParty.detectParty(1, location, cookie.domain, cookie.name);
				exportLists.cookies.list.push([
					systemArguments.config, timestamp, location.protocol, location.host, genericFunctions.encloseQuotes(location.path),
					cookie.domain, genericFunctions.encloseQuotes(cookie.name), genericFunctions.encloseQuotes(cookie.value), genericFunctions.encloseQuotes(cookiePartyInfo.party), genericFunctions.encloseQuotes(cookiePartyInfo['type'])
				].join(delimiter));					
			}
		}
		
		// Add resources to list of resources
		if (configuration.trackResources) {
			for (id in exportLists.resources.resources) {
				resource = exportLists.resources.resources[id];
				exportLists.resources.list.push([
					systemArguments.config, timestamp, location.protocol, location.host, genericFunctions.encloseQuotes(location.path),
					id, genericFunctions.encloseQuotes(resource.content_type), genericFunctions.encloseQuotes(resource.url), genericFunctions.parseURL(resource.url).host, genericFunctions.encloseQuotes(genericFunctions.parseURL(resource.url).path), genericFunctions.encloseQuotes(resource.party.party), genericFunctions.encloseQuotes(resource.party.type), resource.requested, resource.completed, resource.failed
				].join(delimiter));
			}
		}
		
		// Get javascript third party libraries
		if (configuration.scanLibraries) {
			jQueryVersion = page.evaluate(function () {return jQuery().jquery;});
			exportLists.libraries.list.push([systemArguments.config, timestamp, location.protocol, location.host, genericFunctions.encloseQuotes(location.path), 'JQuery', jQueryVersion].join(delimiter));
			console.log('    ' + 'Scanned javascript libraries');
		}		
		
		// Render screenshot as png
		if (configuration.screenshotPage && systemArguments.norendering != 1) {
			filename =  outputDir + '/screenshots/' + encodeURIComponent(location.host + location.path) + '.png';
			
			if (typeof configuration.clipRect == 'undefined')
				clipRect = {width: 0, height: 0};
			else {
				clipRect = configuration.clipRect;
				page.clipRect = configuration.clipRect;
			}
				
			exportLists.screenshots.list.push([
				systemArguments.config, timestamp, location.protocol, location.host, genericFunctions.encloseQuotes(location.path), 
				clipRect.width, clipRect.height, genericFunctions.encloseQuotes(encodeURIComponent(location.host + location.path) + '.png')
			].join(delimiter));

			page.render(filename);
			console.log('    ' + 'Saved screenshot');
		}
		
		// Store cookies, banners, resources screenshots, and errors
		for (listName in exportLists) {
			list = exportLists[listName];
			
			fs.write(outputDir + '/' + listName + '.txt', list.list.join('\n') + '\n', 'a+');		
			
			if (typeof list.log != 'undefined' && list.list.length > 0)
				console.log('    ' + list.log.replace('[x]', list.list.length));
		}
	}
};

