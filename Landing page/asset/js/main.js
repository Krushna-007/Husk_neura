/**
 * Header Sticky
 * Infinite Slide
 * Active Tab
 * Animate Scroll
 * Hacker Text
 * GoTop
 * Active Section
 */

(function ($) {
    "use strict";
    /* Header Sticky
    -------------------------------------------------------------------------*/
    var headerSticky = function () {
        $(window).on("scroll", function () {
            let st = $(window).scrollTop();
            let navbarHeight = $("header").outerHeight();

            if (st >= 250) {
                $("header").css("top", "0").addClass("header-sticky");
                $(".sticky-top").css("top", `${15 + navbarHeight}px`);
            } else {
                $("header").css("top", `-${navbarHeight}px`).removeClass("header-sticky");
                $(".sticky-top").css("top", "15px");
            }
        });
    };

    /* Infinite Slide 
    -------------------------------------------------------------------------*/
    var infiniteSlide = function () {
        if ($(".infiniteSlide").length > 0) {
            $(".infiniteSlide").each(function () {
                var $this = $(this);
                var style = $this.data("style") || "left";
                var clone = $this.data("clone") || 2;
                var speed = $this.data("speed") || 50;
                $this.infiniteslide({
                    speed: speed,
                    direction: style,
                    clone: clone,
                });
            });
        }
    };
    /* Active Tab 
    -------------------------------------------------------------------------*/
    var activeTab = () => {
        $(".tab-can_do .btn_tab").on("click", function () {
            $(".nav-tab-item").removeClass("active");
            $(this).closest(".nav-tab-item").addClass("active");
        });
    };

    /* Animate Scroll
    -------------------------------------------------------------------------*/
    const anime = () => {
        $(".scroll-slide").each(function () {
            let $element = $(this);
            let isReverse = $element.hasClass("reverse");

            gsap.set($element, {
                xPercent: isReverse ? 0 : -50,
            });

            gsap.to($element, {
                xPercent: isReverse ? -50 : 0,
                ease: "none",
                scrollTrigger: {
                    trigger: $element,
                    start: "bottom bottom",
                    end: "top top",
                    scrub: 2,
                    markers: false,
                },
            });
        });
    };
    /* Active Section
    -------------------------------------------------------------------------*/
    var activeSection = () => {
        const menuLinks = $(".nav-mb-item a");
        const sections = menuLinks
            .map(function () {
                return $($(this).attr("href"))[0];
            })
            .get();

        $(window).on("scroll", function () {
            let scrollTop = $(window).scrollTop();
            let windowHeight = $(window).height();

            let bestMatch = null;
            let bestVisibility = 0;

            sections.forEach(function (section) {
                if (!section) return;

                const $section = $(section);
                const offsetTop = $section.offset().top;
                const offsetBottom = offsetTop + $section.outerHeight();

                const visibleTop = Math.max(offsetTop, scrollTop + 100);
                const visibleBottom = Math.min(offsetBottom, scrollTop + windowHeight - 100);
                const visibleHeight = Math.max(0, visibleBottom - visibleTop);

                if (visibleHeight > bestVisibility) {
                    bestVisibility = visibleHeight;
                    bestMatch = section;
                }
            });

            if (bestMatch && bestVisibility > 0) {
                const id = "#" + bestMatch.id;
                menuLinks.removeClass("active");
                menuLinks.filter("[href='" + id + "']").addClass("active");
            } else {
                menuLinks.removeClass("active");
            }
        });

        $(window).trigger("scroll");
    };
    /* Go Top
    -------------------------------------------------------------------------*/
    var goTop = function () {
        var $goTop = $("#goTop");
        var $borderProgress = $(".border-progress");
        var $footer = $(".tf-footer");

        $(window).on("scroll", function () {
            var scrollTop = $(window).scrollTop();
            var docHeight = $(document).height() - $(window).height();
            var scrollPercent = (scrollTop / docHeight) * 100;
            var progressAngle = (scrollPercent / 100) * 360;

            $borderProgress.css("--progress-angle", progressAngle + "deg");

            var footerOffset = $footer.offset().top;
            var windowBottom = scrollTop + $(window).height();

            if (scrollTop > 100 && windowBottom < footerOffset) {
                $goTop.addClass("show");
            } else {
                $goTop.removeClass("show");
            }
        });

        $goTop.on("click", function () {
            $("html, body").animate({ scrollTop: 0 }, 0);
        });
    };
    /* Text Change
    -------------------------------------------------------------------------*/
    var textChange = () => {
        const $items = $(".text-change_rotating");
        let index = 0;

        $items.eq(index).addClass("active").css("display", "flex");

        setInterval(() => {
            const $current = $items.eq(index);
            $current.removeClass("active").fadeOut(300);

            index = (index + 1) % $items.length;
            const $next = $items.eq(index);

            setTimeout(() => {
                $next.css("display", "flex").hide().fadeIn(300).addClass("active");
            }, 300);
        }, 2500);
    };
    /* Anime Border
    -------------------------------------------------------------------------*/
    var animateBorder = () => {
        const $menu = $(".main-nav_menu");
        const $indicator = $("<div class='menu-indicator'></div>");
        $menu.append($indicator);

        const $menuLinks = $(".menu-item a");
        const $menuItems = $(".menu-item");
        let $activeLink = $();
        let hasActiveSection = false;
        let isInsideMenu = false;
        let isAnimating = false;
        function moveIndicatorToItem($item, forceShow = true) {
            const offset = $item.position();
            const width = $item.outerWidth();
            const height = $item.outerHeight();

            $indicator.css({
                top: offset.top + "px",
                left: offset.left + "px",
                width: width + "px",
                height: height + "px",
            });

            if (forceShow) $indicator.show();
        }

        $menuItems.on("mouseenter", function () {
            moveIndicatorToItem($(this), true);
        });

        $menu.on("mouseenter", function () {
            isInsideMenu = true;
        });

        $menu.on("mouseleave", function () {
            isInsideMenu = false;

            if (!hasActiveSection) {
                $indicator.hide();
            } else if ($activeLink.length) {
                moveIndicatorToItem($activeLink.closest(".menu-item"), true);
            }
        });

        $menuLinks.on("click", function () {
            $menuLinks.removeClass("active");
            $(this).addClass("active");
            $activeLink = $(this);
            moveIndicatorToItem($activeLink.closest(".menu-item"), true);
        });

        const sections = $menuLinks
            .map(function () {
                return $($(this).attr("href"))[0];
            })
            .get();

        $(window).on("scroll", function () {
            let scrollTop = $(window).scrollTop();
            let windowHeight = $(window).height();

            let bestMatch = null;
            let bestVisibility = 0;

            sections.forEach(function (section) {
                if (!section) return;

                const $section = $(section);
                const offsetTop = $section.offset().top;
                const offsetBottom = offsetTop + $section.outerHeight();

                const visibleTop = Math.max(offsetTop, scrollTop + 100);
                const visibleBottom = Math.min(offsetBottom, scrollTop + windowHeight - 100);
                const visibleHeight = Math.max(0, visibleBottom - visibleTop);

                if (visibleHeight > bestVisibility) {
                    bestVisibility = visibleHeight;
                    bestMatch = section;
                }
            });

            if (bestMatch && bestVisibility > 0) {
                const id = "#" + bestMatch.id;
                const $newActiveLink = $menuLinks.filter("[href='" + id + "']");

                if (!$newActiveLink.is($activeLink)) {
                    $menuLinks.removeClass("active");
                    $newActiveLink.addClass("active");
                    $activeLink = $newActiveLink;
                    moveIndicatorToItem($activeLink.closest(".menu-item"), true);
                }

                hasActiveSection = true;
                $indicator.show();
            } else {
                hasActiveSection = false;
                $menuLinks.removeClass("active");
                $activeLink = $();

                if (!isInsideMenu) {
                    $indicator.hide();
                }
            }
        });

        $(window).trigger("scroll");
    };
    /* Counter Odo
    -------------------------------------------------------------------------*/
    var counterOdo = () => {
        function isElementInViewport($el) {
            var top = $el.offset().top;
            var bottom = top + $el.outerHeight();
            var viewportTop = $(window).scrollTop();
            var viewportBottom = viewportTop + $(window).height();
            return bottom > viewportTop && top < viewportBottom;
        }

        function runCounterIfInView() {
            $(".wg-counter").each(function () {
                var $counter = $(this);
                if (isElementInViewport($counter) && !$counter.hasClass("counted")) {
                    $counter.addClass("counted");
                    var targetNumber = $counter.find(".odometer").data("number");

                    setTimeout(function () {
                        $counter.find(".odometer").text(targetNumber);
                    }, 500);
                }
            });
        }

        if ($(".counter-scroll").length > 0) {
            runCounterIfInView();

            $(window).on("scroll", function () {
                runCounterIfInView();
            });
        }
    };
    /* Hack Text
    -------------------------------------------------------------------------*/
    var hackerTextTransform = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        function isInViewport($el) {
            const rect = $el[0].getBoundingClientRect();
            return rect.top <= $(window).height() && rect.bottom >= 0;
        }

        function runEffect($el, text, instantReveal = false) {
            let display = text.split("").map(() => " ");
            let revealed = new Array(text.length).fill(false);
            const totalLength = text.length;

            let scrambleInterval = setInterval(() => {
                for (let i = 0; i < totalLength; i++) {
                    if (!revealed[i]) {
                        display[i] = chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                }
                $el.text(display.join(""));
            }, 40);

            if (instantReveal) {
                setTimeout(() => {
                    for (let i = 0; i < totalLength; i++) {
                        revealed[i] = true;
                        display[i] = text[i];
                    }
                    clearInterval(scrambleInterval);
                    $el.text(display.join(""));
                }, 700);
            } else {
                for (let i = totalLength - 1; i >= 0; i--) {
                    setTimeout(() => {
                        revealed[i] = true;
                        display[i] = text[i];

                        if (i === 0) {
                            clearInterval(scrambleInterval);
                            $el.text(display.join(""));
                        }
                    }, (totalLength - 1 - i) * 150);
                }
            }
        }

        function triggerTextEffect() {
            $(".hacker-text_transform").each(function () {
                const $this = $(this);
                if ($this.data("done")) return;

                if (isInViewport($this)) {
                    let text = $this.attr("data-text");
                    if (typeof text === "undefined") {
                        text = $this.text().trim();
                    }

                    const instantReveal = $this.hasClass("no-delay");

                    setTimeout(() => {
                        runEffect($this, text, instantReveal);
                    }, 300);

                    $this.data("done", true);
                }
            });
        }

        $(function () {
            triggerTextEffect();
        });

        $(window).on("scroll", function () {
            triggerTextEffect();
        });
    };
    /* Scroll Link
    -------------------------------------------------------------------------*/
    var scrollLink = () => {
        $(".scroll-link").on("click", function (e) {
            e.preventDefault();

            var targetId = $(this).attr("href");
            var headerHeight = $(".tf-header").outerHeight();

            if ($(targetId).length) {
                var offset = $(targetId).offset().top - headerHeight - 1;

                $("html, body").animate(
                    {
                        scrollTop: offset,
                    },
                    100
                );
            }
        });
    };
    // Dom Ready
    $(function () {
        anime();
        activeTab();
        headerSticky();
        infiniteSlide();
        textChange();
        animateBorder();
        goTop();
        counterOdo();
        hackerTextTransform();
        activeSection();
        scrollLink();
    });
})(jQuery);
