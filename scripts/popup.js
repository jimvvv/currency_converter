// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });

    // Most methods of the Chrome extension APIs are asynchronous. This means that
    // you CANNOT do something like this:
    //
    // var url;
    // chrome.tabs.query(queryInfo, function(tabs) {
    //   url = tabs[0].url;
    // });
    // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getImageUrl(searchTerm, callback, errorCallback) {
    // Google image search - 100 searches per day.
    // https://developers.google.com/image-search/
    var searchUrl = 'https://ajax.googleapis.com/ajax/services/search/images' +
        '?v=1.0&q=' + encodeURIComponent(searchTerm);
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    // The Google image search API responds with JSON, so let Chrome parse it.
    x.responseType = 'json';
    x.onload = function() {
        // Parse and process the response from Google Image Search.
        var response = x.response;
        if (!response || !response.responseData || !response.responseData.results ||
            response.responseData.results.length === 0) {
            errorCallback('No response from Google Image search!');
            return;
        }
        var firstResult = response.responseData.results[0];
        // Take the thumbnail instead of the full image to get an approximately
        // consistent image size.
        var imageUrl = firstResult.tbUrl;
        var width = parseInt(firstResult.tbWidth);
        var height = parseInt(firstResult.tbHeight);
        console.assert(
            typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
            'Unexpected respose from the Google Image Search API!');
        callback(imageUrl, width, height);
    };
    x.onerror = function() {
        errorCallback('Network error.');
    };
    x.send();
}

// function convert() {
//     var srcCurrency = $("select.from").val();
//     var dstCurrency = $("select.to").val();
//     var amount = $("input.from").val();
//     console.log(srcCurrency + ' ' + dstCurrency + ' ' + amount);

//     var srcExchangeRate = 0;
//     var dstExchangeRate;
//     chrome.storage.local.get('currency', function(obj) {
//         srcExchangeRate = obj.currency[srcCurrency];
//         dstExchangeRate = obj.currency[dstCurrency];
//         calculation(srcExchangeRate, dstExchangeRate, amount);
//     });
// }

function convert(){
    var srcExchangeRate = $("select.from").val();
    var dstExchangeRate = $("select.to").val();
    var amount = $("input.from").val();
    calculation(srcExchangeRate, dstExchangeRate, amount);
}

function calculation(srcRate, dstRate, amount) {
    $("input.to").val(dstRate / srcRate * amount);
}


function saveCurrency(currencyList) {
    var dataObj = {};
    dataObj['currency'] = currencyList;
    chrome.storage.local.set(dataObj, function() {
        console.log(dataObj);
        var test = chrome.storage.local.get('currency', function(obj) {
            console.log(obj.currency);
        });
    });
}

function clear() {
    chrome.storage.local.clear(function() {
        console.log('Clear successful!');
    });
}


function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

function filter(){
  chrome.storage.local.get('currency', function(obj){
    filterFunction(obj);
  });
}

function filterFunction(obj) {
    var input, filter, div, filterResult;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("testDiv");
    while (div.firstChild) {
    div.removeChild(div.firstChild);
}
    filterResult = [];    
    for (property in obj.currency){
      if (property.toUpperCase().indexOf(filter) > -1) {
        filterResult.push(property);
      }
    }

    for (var i = filterResult.length - 1; i >= 0; i--) {
        var newElement = document.createElement("a");
        newElement.appendChild(document.createTextNode(filterResult[i]));
        div.appendChild(newElement);
    }

    // for (i = 0; i < a.length; i++) {
    //     if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
    //         a[i].style.display = "";
    //     } else {
    //         a[i].style.display = "none";
    //     }
    // }
}

document.addEventListener('DOMContentLoaded', function() {

    //TODO: Update currency list

    
    $("input").focusin(function() {
        $("input").each(function() {
            if ($(this).is(":focus")) {
                $(this).prop("class", "from");
                $(this).siblings().prop("class", "from");
            } else {
                $(this).prop("class", "to");
                $(this).siblings().prop("class", "to");
            }
        });
    });

    $("div").on("keyup", "input.from", function() {
        convert();
    });

    $("div").on("change", "select", function() {
        convert();
    });

    $("#myInput").on("keyup", filter);

    document.getElementById('save').addEventListener('click', function() {
        saveCurrency(mockJson.currency);
    });

    document.getElementById('clear').addEventListener('click', function() {
        clear();
    });

    var mockJson = {
        ignoreKey: "ignoreValue",
        currency: {
            "AED": 3.673014,
            "AFN": 69.247,
            "ALL": 108.450054,
            "AMD": 483.164905,
            "ANG": 1.781709,
            "AOA": 209.644,
            "ARS": 19.898366,
            "AUD": 1.276318,
            "AWG": 1.799,
            "AZN": 1.68825,
            "BAM": 1.594938,
            "BBD": 2,
            "BDT": 82.849999,
            "BGN": 1.59846,
            "BHD": 0.376082,
            "BIF": 1755.438054,
            "BMD": 1,
            "BND": 1.328998,
            "BOB": 6.897628,
            "BRL": 3.2939,
            "BSD": 1,
            "BTC": 0.000119577631,
            "BTN": 64.277972,
            "BWP": 9.662785,
            "BYN": 1.996153,
            "BZD": 2.006402,
            "CAD": 1.256263,
            "CDF": 1613.322925,
            "CHF": 0.938195,
            "CLF": 0.02265,
            "CLP": 604.8,
            "CNH": 6.312833,
            "CNY": 6.3,
            "COP": 2882.6,
            "CRC": 573.296537,
            "CUC": 1,
            "CUP": 25.5,
            "CVE": 90.375,
            "CZK": 20.658475,
            "DJF": 177.27,
            "DKK": 6.061044,
            "DOP": 48.86074,
            "DZD": 113.987515,
            "EGP": 17.616,
            "ERN": 15.030833,
            "ETB": 27.361637,
            "EUR": 0.814121,
            "FJD": 2.023097,
            "FKP": 0.721336,
            "GBP": 0.721336,
            "GEL": 2.447438,
            "GGP": 0.721336,
            "GHS": 4.437121,
            "GIP": 0.721336,
            "GMD": 47.18,
            "GNF": 9008.6,
            "GTQ": 7.346843,
            "GYD": 206.739115,
            "HKD": 7.82015,
            "HNL": 23.597484,
            "HRK": 6.082005,
            "HTG": 63.986752,
            "HUF": 254.2545,
            "IDR": 13616.12751,
            "ILS": 3.518652,
            "IMP": 0.721336,
            "INR": 64.268333,
            "IQD": 1190.525723,
            "IRR": 36988.667176,
            "ISK": 101.94,
            "JEP": 0.721336,
            "JMD": 125.122918,
            "JOD": 0.709703,
            "JPY": 108.69222727,
            "KES": 100.574864,
            "KGS": 68.8875,
            "KHR": 4047.041667,
            "KMF": 402.438705,
            "KPW": 900,
            "KRW": 1082.451667,
            "KWD": 0.30018,
            "KYD": 0.831856,
            "KZT": 326.915673,
            "LAK": 8271.35,
            "LBP": 1508.637443,
            "LKR": 154.10545,
            "LRD": 125.619289,
            "LSL": 12.083854,
            "LYD": 1.333744,
            "MAD": 9.2308,
            "MDL": 16.6405,
            "MGA": 3179.376613,
            "MKD": 50.213535,
            "MMK": 1331.060206,
            "MNT": 2401,
            "MOP": 8.040914,
            "MRO": 355,
            "MRU": 35.27,
            "MUR": 32.874096,
            "MVR": 15.409873,
            "MWK": 724.415367,
            "MXN": 18.6542,
            "MYR": 3.9568,
            "MZN": 60.62611,
            "NAD": 12.083854,
            "NGN": 359.773899,
            "NIO": 31.038103,
            "NOK": 7.94773,
            "NPR": 102.846291,
            "NZD": 1.375976,
            "OMR": 0.383999,
            "PAB": 1,
            "PEN": 3.259441,
            "PGK": 3.227011,
            "PHP": 51.7005,
            "PKR": 110.56661,
            "PLN": 3.405075,
            "PYG": 5581.7,
            "QAR": 3.6345,
            "RON": 3.806701,
            "RSD": 96.94,
            "RUB": 58.0453,
            "RWF": 847.245575,
            "SAR": 3.7501,
            "SBD": 7.727669,
            "SCR": 13.728833,
            "SDG": 18.064654,
            "SEK": 8.067725,
            "SGD": 1.325599,
            "SHP": 0.721336,
            "SLL": 7680,
            "SOS": 576.879786,
            "SRD": 7.468,
            "SSP": 130.2634,
            "STD": 19995.483881,
            "STN": 20.09,
            "SVC": 8.734537,
            "SYP": 515.02999,
            "SZL": 12.076293,
            "THB": 31.62,
            "TJS": 8.802792,
            "TMT": 3.509961,
            "TND": 2.405998,
            "TOP": 2.223004,
            "TRY": 3.806334,
            "TTD": 6.718121,
            "TWD": 29.30402,
            "TZS": 2248.687374,
            "UAH": 26.981167,
            "UGX": 3634.533069,
            "USD": 1,
            "UYU": 28.645625,
            "UZS": 8172.45,
            "VEF": 24967.5,
            "VND": 22696.891708,
            "VUV": 105.507174,
            "WST": 2.515668,
            "XAF": 534.02842,
            "XAG": 0.06067602,
            "XAU": 0.00075544,
            "XCD": 2.70255,
            "XDR": 0.692217,
            "XOF": 534.02842,
            "XPD": 0.00101319,
            "XPF": 97.150487,
            "XPT": 0.00102989,
            "YER": 250.375,
            "ZAR": 11.962622,
            "ZMW": 9.707474,
            "ZWL": 322.355011
        }
    };

    $.each(mockJson.currency, function (i, item) {
        //TODO: Detect the country of IP and set default currency for the user.
        //TODO: Give users an option to set the default currency.
        //https://detect-ip-address.herokuapp.com/json/
        if (i == "CNY") {
            $('#from').append($('<option>', { 
            value: item,
            text : i,
            selected: true
        }));
        }
        else if (i == "USD") {
            $('#to').append($('<option>', { 
            value: item,
            text : i,
            selected: true
        }));
        }
        else {
            $('select').append($('<option>', { 
            value: item,
            text : i 
        }));
        }        
    });
});