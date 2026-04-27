// ==========================================
// LOTTIE BACKGROUND - TELA DE LOGIN
// Injeta animação Lottie no fundo do login
// Não modifica nenhum código existente
// ==========================================
(function () {
    function injectLottieBg() {
        const loginScreen = document.getElementById('loginScreen');
        if (!loginScreen) return;

        // Container da animação
        const container = document.createElement('div');
        container.id = 'lottie-login-bg';
        container.style.cssText = [
            'position:absolute',
            'inset:0',
            'width:100%',
            'height:100%',
            'overflow:hidden',
            'pointer-events:none',
            'z-index:0',
            'opacity:0.18',
            'display:flex',
            'align-items:center',
            'justify-content:center',
        ].join(';');

        // Garante que o loginScreen tenha position relativa
        const currentPos = window.getComputedStyle(loginScreen).position;
        if (currentPos === 'static') {
            loginScreen.style.position = 'relative';
        }

        loginScreen.insertBefore(container, loginScreen.firstChild);

        // Carrega Lottie via CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
        script.onload = function () {
            fetch('PC_Coding_and_Dislay_app_Mobile.json')
                .then(function (r) { return r.json(); })
                .then(function (animData) {
                    lottie.loadAnimation({
                        container: container,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: animData,
                        rendererSettings: {
                            preserveAspectRatio: 'xMidYMid slice'
                        }
                    });
                })
                .catch(function (e) {
                    console.warn('[lottie-bg] Não foi possível carregar a animação:', e);
                });
        };
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectLottieBg);
    } else {
        injectLottieBg();
    }
})();
