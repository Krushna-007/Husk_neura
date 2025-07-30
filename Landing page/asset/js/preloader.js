// Preloader JavaScript
(function() {
    'use strict';

    // Preloader configuration
    const preloaderConfig = {
        minDisplayTime: 2000, // Minimum display time in milliseconds
        fadeOutDuration: 800, // Fade out duration in milliseconds
        progressUpdateInterval: 50, // Progress update interval in milliseconds
        fakeProgressDuration: 1500, // Duration for fake progress simulation
    };

    // DOM elements
    const preloader = document.getElementById('preload');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const preloaderText = document.querySelector('.preloader-text');

    // Loading state
    let currentProgress = 0;
    let isLoadingComplete = false;
    let startTime = Date.now();

    // Utility functions
    function updateProgress(percentage) {
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
        if (progressPercentage) {
            progressPercentage.textContent = Math.round(percentage) + '%';
        }
    }

    function simulateProgress() {
        const targetProgress = Math.min(100, currentProgress + (Math.random() * 15 + 5));
        const step = (targetProgress - currentProgress) / 20;
        
        const interval = setInterval(() => {
            currentProgress += step;
            if (currentProgress >= targetProgress) {
                currentProgress = targetProgress;
                clearInterval(interval);
            }
            updateProgress(currentProgress);
            
            if (currentProgress >= 100) {
                completeLoading();
            }
        }, preloaderConfig.progressUpdateInterval);
    }

    function completeLoading() {
        if (isLoadingComplete) return;
        isLoadingComplete = true;

        // Add loading complete class
        if (preloader) {
            preloader.classList.add('loading-complete');
        }

        // Update text
        if (preloaderText) {
            preloaderText.textContent = 'Loading Complete';
        }

        // Calculate remaining time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, preloaderConfig.minDisplayTime - elapsedTime);

        // Hide preloader after remaining time
        setTimeout(() => {
            hidePreloader();
        }, remainingTime);
    }

    function hidePreloader() {
        if (!preloader) return;

        preloader.classList.add('fade-out');
        
        setTimeout(() => {
            preloader.style.display = 'none';
            preloader.remove();
            
            // Trigger any post-loading animations
            document.body.classList.add('loaded');
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('preloaderComplete'));
        }, preloaderConfig.fadeOutDuration);
    }

    // Real loading detection
    function handleRealLoading() {
        const images = document.querySelectorAll('img[data-src], img[src]');
        const videos = document.querySelectorAll('video source');
        const totalAssets = images.length + videos.length;
        let loadedAssets = 0;

        if (totalAssets === 0) {
            // No assets to load, complete immediately
            setTimeout(() => completeLoading(), 500);
            return;
        }

        function assetLoaded() {
            loadedAssets++;
            const progress = (loadedAssets / totalAssets) * 100;
            updateProgress(progress);
            
            if (loadedAssets >= totalAssets) {
                completeLoading();
            }
        }

        // Handle images
        images.forEach(img => {
            if (img.dataset.src) {
                const newImg = new Image();
                newImg.onload = assetLoaded;
                newImg.onerror = assetLoaded;
                newImg.src = img.dataset.src;
            } else if (img.src) {
                if (img.complete) {
                    assetLoaded();
                } else {
                    img.onload = assetLoaded;
                    img.onerror = assetLoaded;
                }
            }
        });

        // Handle videos
        videos.forEach(video => {
            const videoElement = video.parentElement;
            if (videoElement.readyState >= 2) {
                assetLoaded();
            } else {
                videoElement.addEventListener('loadeddata', assetLoaded);
                videoElement.addEventListener('error', assetLoaded);
            }
        });

        // Fallback: complete after timeout
        setTimeout(() => {
            if (!isLoadingComplete) {
                completeLoading();
            }
        }, 10000);
    }

    // Initialize preloader
    function initPreloader() {
        if (!preloader) return;

        // Start progress simulation
        const progressInterval = setInterval(() => {
            if (isLoadingComplete) {
                clearInterval(progressInterval);
                return;
            }
            simulateProgress();
        }, 300);

        // Handle real loading
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', handleRealLoading);
        } else {
            handleRealLoading();
        }

        // Handle window load
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (!isLoadingComplete) {
                    completeLoading();
                }
            }, 500);
        });
    }

    // Enhanced loading with GSAP if available
    function initEnhancedAnimations() {
        if (typeof gsap !== 'undefined') {
            // GSAP animations for enhanced effects
            gsap.set('.preloader-favicon', { scale: 0.8, opacity: 0 });
            gsap.set('.preloader-ring', { scale: 0.8, opacity: 0 });
            gsap.set('.preloader-pulse', { scale: 0.8, opacity: 0 });
            gsap.set('.preloader-text', { y: 20, opacity: 0 });
            gsap.set('.preloader-progress', { y: 20, opacity: 0 });
            gsap.set('.preloader-percentage', { y: 20, opacity: 0 });

            // Entrance animation
            const tl = gsap.timeline();
            tl.to('.preloader-favicon', { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" })
              .to('.preloader-ring', { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
              .to('.preloader-pulse', { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
              .to('.preloader-text', { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.3")
              .to('.preloader-progress', { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.2")
              .to('.preloader-percentage', { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.2");
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPreloader();
            initEnhancedAnimations();
        });
    } else {
        initPreloader();
        initEnhancedAnimations();
    }

    // Expose functions globally for external control
    window.preloader = {
        complete: completeLoading,
        update: updateProgress,
        hide: hidePreloader
    };

    // Performance optimization
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Preload critical resources
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = 'asset/images/logo/favicon_new.svg';
            document.head.appendChild(link);
        });
    }

})();
