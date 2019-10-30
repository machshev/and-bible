/**
 * WebView js functions for moving to verse, selecting verses
 *
 * @author Martin Denham [mjdenham at gmail dot com]
 */
var lineHeight = 0;
$(window).load(
    function() {
        jsInterface.log("JS onload");
        jsInterface.onLoad();
        lineHeight = parseFloat(window.getComputedStyle(document.body)
            .getPropertyValue('line-height'));
        registerVersePositions();
        $(document).bind("touchstart", function(event) {
            stopAnimation = true;
        } );
    }
);

export function jsonscroll() {
    jsInterface.onScroll(window.pageYOffset);
}

export function registerVersePositions() {
    console.log("Registering verse positions", lineHeight);
    jsInterface.clearVersePositionCache();
    
    var verseTags = getVerseElements();
    jsInterface.log("Num verses found:"+verseTags.length);
    for (let i=0; i<verseTags.length; i++) {
        const verseTag = verseTags[i];
        // send position of each verse to java to allow calculation of current verse after each scroll
        jsInterface.registerVersePosition(verseTag.id, verseTag.offsetTop
            + Math.max(0, verseTag.offsetHeight - 2*lineHeight));
    }
//    jsInterface.log("Register document height:"+document.height);
//    jsInterface.setDocumentHeightWhenVersePositionsRegistered(document.height);
}

function getVerseElements() {
    return getElementsByClass("verse", document.body, "span")
}

function getElementsByClass( searchClass, domNode, tagName) {
    if (domNode == null) domNode = document;
    if (tagName == null) tagName = '*';
    var matches = [];
    
    var tagMatches = domNode.getElementsByTagName(tagName);
    jsInterface.log("Num spans found:"+tagMatches.length);

    var searchClassPlusSpace = " "+searchClass+" ";
    for(let i=0; i<tagMatches.length; i++) {
        var tagClassPlusSpace = " " + tagMatches[i].className + " ";
        if (tagClassPlusSpace.indexOf(searchClassPlusSpace) !== -1)
            matches.push(tagMatches[i]);
    } 
    return matches;
}

var currentAnimation = null;
var stopAnimation = false;

function doScrolling(elementY, duration) {
    console.log("doScrolling", elementY, duration);
    stopAnimation = false;
    var startingY = window.pageYOffset;
    var diff = elementY - startingY;
    var start;
    if(currentAnimation) {
        window.cancelAnimationFrame(currentAnimation);
    }

    if(duration === 0) {
        window.scrollTo(0, elementY);
        return;
    }

    // Bootstrap our animation - it will get called right before next frame shall be rendered.
    currentAnimation = window.requestAnimationFrame(function step(timestamp) {
        if (!start) start = timestamp;
        // Elapsed milliseconds since start of scrolling.
        var time = timestamp - start;
        // Get percent of completion in range [0, 1].
        var percent = Math.min(time / duration, 1);

        window.scrollTo(0, startingY + diff * percent);

        // Proceed with animation as long as we wanted it to.
        if (time < duration && stopAnimation === false) {
            currentAnimation = window.requestAnimationFrame(step);
        }
        else {
            currentAnimation = null;
        }
    })
}

export function scrollToVerse(toId, now, deltaParam) {
    console.log("scrollToVerse", toId, now, deltaParam);
    stopAnimation = true;
    var delta = toolbarOffset;
    if(deltaParam !== undefined) {
        delta = deltaParam;
    }

    var toElement = document.getElementById(toId) || document.getElementById("topOfBibleText");

    if (toElement != null) {
        var diff = toElement.offsetTop - window.pageYOffset;
        if(Math.abs(diff) > 800 / window.devicePixelRatio) {
            now = true;
        }
        console.log("Scrolling to", toElement, toElement.offsetTop - delta);
        if(now===true) {
            window.scrollTo(0, toElement.offsetTop - delta);
        }
        else {
            doScrolling(toElement.offsetTop - delta, 1000);
        }
    }
}

function doScrollToSlowly(element, elementPosition, to) {
    // 25 pixels/100ms is the standard speed
    var speed = 25; 
    var difference = to - elementPosition;
    if (difference === 0) return;
    var perTick = Math.max(Math.min(speed, difference),-speed);
    
    setTimeout(function() {
        // scrolling is sometimes delayed so keep track of scrollTop rather than calling element.scrollTop
        var newElementScrollTop = elementPosition + perTick;
        element.scrollTop = newElementScrollTop;
        doScrollTo(element, newElementScrollTop, to);
    }, 100);
}

/**
 * Monitor verse selection via long press
 */
export function enableVerseLongTouchSelectionMode() {
    jsInterface.log("Enabling verse long touch selection mode");
    // Enable special selection for Bibles
    $(document).longpress( tapholdHandler );
}

export function enableVerseTouchSelection() {
    jsInterface.log("Enabling verse touch selection");
    // Enable special selection for Bibles
    $(document).bind("touchstart", touchHandler );

}

export function disableVerseTouchSelection() {
    jsInterface.log("Disabling verse touch selection");

    $(document).unbind("touchstart", touchHandler );
}

/** Handle taphold to start verse selection */
var tapholdHandler = function(event) {
    var $target = $(event.target);
    if ($target.hasClass("verse")) {
        selected($target);
    } else {
        var point = {'x': event.pageX, 'y': event.pageY};
        var $elemSet = $('.verse');
        var $closestToPoint = $.nearest(point, $elemSet).filter(":first");

        selected($closestToPoint)
    }
};

/** Handle touch to extend verse selection */
var touchHandler = function(event) {
    var $target = $(event.target);
    if (!$target.hasClass("verse")) {
        var point = {'x': event.pageX, 'y': event.pageY};
        var $elemSet = $('.verse');
        var $closestToPoint = $.nearest(point, $elemSet).filter(":first");

        $target = $closestToPoint
    }

    var chapterVerse = $target.attr('id');
    jsInterface.verseTouch(chapterVerse);
};


function selected($elem) {
    if ($elem.hasClass("verse")) {
        var chapterVerse = $elem.attr('id');
        jsInterface.verseLongPress(chapterVerse);
    }
}

/**
 * Called by VerseActionModelMediator to highlight a verse
 */


var toolbarOffset = 0;

export function setToolbarOffset(value, options) {
    console.log("setToolbarOffset", value, options)
    var opts = options || {};
    var diff = toolbarOffset - value;
    toolbarOffset = value;
    var delay = 500;
    if(opts.immediate) {
        delay = 0;
    }

    if(diff != 0 && !opts.doNotScroll) {
        doScrolling(window.pageYOffset + diff, delay)
    }
}

export function highlightVerse(chapterVerse, start) {
    var $verseSpan = $('#'+escapeSelector(chapterVerse));
    if(start && $verseSpan[0].offsetTop < window.pageYOffset + toolbarOffset) {
        doScrolling($verseSpan[0].offsetTop - toolbarOffset, 250);
    }
    $verseSpan.addClass("selected")
}

/**
 * Called by VerseActionModelMediator to unhighlight a verse
 */
export function unhighlightVerse(chapterVerse) {
    var $verseSpan = $('#'+escapeSelector(chapterVerse));
    $verseSpan.removeClass("selected")
}

/**
 * Called by VerseActionModelMediator to unhighlight a verse
 */
export function clearVerseHighlight() {
    var $verseSpan = $('.selected');
    $verseSpan.removeClass("selected")
}

function escapeSelector(selectr) {
    return (selectr+"").replace(".", "\\.")
}