import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CampingMap = ({
                        allProducts = [],
                        availableProducts = [],
                        selectedCategory = 'all',
                        totalOccupants = 0,
                        startDate,
                        endDate,
                        nbAdults,
                        nbChildren,
                        isAdmin = false,
                        onProductSelect
                    }) => {
    const svgRef = useRef(null);
    const navigate = useNavigate();

    // 🧠 LE CERVEAU POUR DÉDUIRE LA CAPACITÉ
    const extractCapacity = (title) => {
        const t = title.toLowerCase();

        if (t.includes('6-8')) return 8;
        if (t.includes('5 pers')) return 5;
        if (t.includes('4 pers')) return 4;
        if (t.includes('3 pers')) return 3;

        if (t.includes('6 places')) return 6;
        if (t.includes('4 places')) return 4;
        if (t.includes('2 places')) return 2;

        if (t.includes('12 m')) return 6;
        if (t.includes('8 m')) return 4;

        return 4;
    };

    // ❄️ LOGIQUE DE FERMETURE ANNUELLE (Du 05 Mai au 10 Octobre)
    const checkIsClosed = () => {
        if (!isAdmin) return false;

        const targetDate = startDate ? new Date(startDate) : new Date();
        const currentMonth = targetDate.getMonth();
        const currentDay = targetDate.getDate();

        if (currentMonth < 4) return true;
        if (currentMonth === 4 && currentDay < 5) return true;
        if (currentMonth > 9) return true;
        if (currentMonth === 9 && currentDay > 10) return true;

        return false;
    };

    const isClosed = checkIsClosed();

    useEffect(() => {
        if (!svgRef.current || allProducts?.length === 0) return;

        const elements = svgRef.current.querySelectorAll('[id^="product-"]');

        elements.forEach(el => {
            if (el.id.includes('_')) return;

            const productId = parseInt(el.id.replace('product-', ''), 10);
            if (isNaN(productId) || productId > 90) return;

            const product = allProducts.find(p => p.id === productId);
            const isAvailable = availableProducts.some(p => p.id === productId);

            // Si le produit n'existe pas dans la BDD
            if (!product) {
                el.style.fill = "#E2E8F0";
                el.style.opacity = "0.5";
                el.style.cursor = "not-allowed";
                el.style.pointerEvents = "none";
                return;
            }

            // 🔒 VÉRIFICATION : Le bien est vendu s'il a au moins 1 utilisateur lié
            const productUsers = product.user || product.users || [];
            const isSold = productUsers.length > 0;

            const title = product.title.toLowerCase();
            const capacity = extractCapacity(title);

            let matchesCategory = false;
            if (selectedCategory === 'all') matchesCategory = true;
            else if (selectedCategory === 'mh' && title.startsWith('mobilehome')) matchesCategory = true;
            else if (selectedCategory === 'caravane' && title.startsWith('caravane')) matchesCategory = true;
            else if (selectedCategory === 'emplacement' && title.startsWith('emplacement')) matchesCategory = true;

            // 🛑 LOGIQUE D'AFFICHAGE VISUEL
            if (isClosed) {
                el.style.fill = "#cbd5e1";
                el.style.opacity = "0.4";
                el.style.pointerEvents = "none";
                el.style.cursor = "not-allowed";
            } else if (isSold) {
                // BIEN DÉJÀ VENDU : VISIBLE MAIS INCLIQUABLE
                el.style.fill = "#334155"; // Gris très foncé
                el.style.opacity = "0.8";
                el.style.pointerEvents = "none"; // Bloque l'interaction CSS
                el.style.cursor = "not-allowed";
                el.onclick = null; // Sécurité JS
            } else if (!matchesCategory || capacity < totalOccupants) {
                el.style.fill = "#E2E8F0";
                el.style.opacity = "0.4";
                el.style.pointerEvents = "none";
            } else if (!isAvailable && !onProductSelect) {
                // Rouge car loué (Uniquement pour les clients, pas pour le gérant qui vend)
                el.style.fill = "#EF4444";
                el.style.opacity = "1";
                el.style.pointerEvents = "none";
            } else {
                // BIEN DISPONIBLE (Pour la location ou la vente)
                el.style.opacity = "1";
                el.style.cursor = "pointer";
                el.style.pointerEvents = "auto";
                el.style.transition = "all 0.3s ease";

                if (capacity <= 3) el.style.fill = "#3B82F6";
                else if (capacity === 4) el.style.fill = "#10B981";
                else if (capacity === 5) el.style.fill = "#F59E0B";
                else if (capacity >= 6) el.style.fill = "#8B5CF6";
            }

            // 🎯 LOGIQUE DE CLIC (Seulement si c'est ouvert ET non vendu)
            if (!isClosed && !isSold) {
                el.onclick = (e) => {
                    e.stopPropagation();

                    const canClick = onProductSelect
                        ? matchesCategory
                        : (matchesCategory && isAvailable && capacity >= totalOccupants);

                    if (canClick) {
                        if (onProductSelect) {
                            elements.forEach(otherEl => {
                                if(otherEl.style.stroke === "white") otherEl.style.stroke = "black";
                            });
                            el.style.stroke = "white";
                            onProductSelect(product);
                        } else {
                            navigate(`/product/${product.id}`, {
                                state: { startDate, endDate, nbAdults, nbChildren }
                            });
                        }
                    }
                };
            }
        });

    }, [availableProducts, allProducts, selectedCategory, totalOccupants, navigate, isClosed, startDate, onProductSelect]);

    return (
        <div className="w-full bg-white rounded-[2rem] shadow-xl p-4 md:p-8 border border-amber-50 overflow-hidden relative">

            <div className="w-full relative cursor-grab active:cursor-grabbing">

                {isClosed && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-2xl">
                        <div className="bg-white px-10 py-8 rounded-[2rem] shadow-2xl text-center border-4 border-amber-500 transform -rotate-2">
                            <span className="text-6xl block mb-4 drop-shadow-sm">❄️</span>
                            <h3 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-widest">
                                Domaine Fermé
                            </h3>
                            <p className="text-amber-600 font-bold mt-2 text-sm md:text-base uppercase tracking-wider">
                                Période hors saison
                            </p>
                            <p className="text-slate-500 font-medium mt-4 text-sm max-w-sm mx-auto leading-relaxed">
                                Le camping est ouvert exclusivement du <strong className="text-slate-700">5 Mai au 10 Octobre</strong>.
                            </p>
                        </div>
                    </div>
                )}

                <svg ref={svgRef} width="100%" viewBox="0 0 2774 2065" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="PlanCamping" clipPath="url(#clip0_1_2)">
                        <rect width="2774" height="2065" fill="white"/>
                        <g id="Decor">
                            <rect id="Rectangle 15" x="31" y="1545" width="388" height="490" fill="#FBF1A4"/>
                            <rect id="Rectangle 52" x="1896" y="1211" width="887" height="865" fill="#FBF1A4"/>
                            <rect id="Rectangle 55" x="2683" y="1208" width="91" height="31" fill="#27B71A"/>
                            <rect id="Piscine" x="2057.54" y="2127.92" width="933.167" height="672.323" transform="rotate(-41.0431 2057.54 2127.92)" fill="#00FFFF"/>
                            <rect id="Rectangle 1" x="419" y="1703" width="129" height="332" fill="#514F4F"/>
                            <rect id="Piscine_2" x="115" y="1839" width="232" height="132" fill="#00FFFF"/>
                            <rect id="petit bassin" x="86" y="1749" width="100" height="70" fill="#00FFFF"/>
                            <rect id="Rectangle 6" y="31" width="31" height="2035" fill="#27B71A"/>
                            <rect id="Rectangle 4" x="1886" y="1217" width="31" height="567" fill="#27B71A"/>
                            <rect id="Rectangle 12" x="1238" y="930" width="104" height="847" fill="#27B71A"/>
                            <rect id="Rectangle 13" x="1664" y="1014" width="222" height="131" fill="#27B71A"/>
                            <rect id="Rectangle 29" x="1664" y="1846" width="253" height="193" fill="#27B71A"/>
                            <rect id="Rectangle 30" x="2503" y="1020" width="57" height="188" fill="#27B71A"/>
                            <rect id="Rectangle 14" x="1008" y="930" width="230" height="103" fill="#27B71A"/>
                            <rect id="Rectangle 50" x="31" y="31" width="217" height="172" fill="#27B71A"/>
                            <rect id="Rectangle 51" x="31" y="366" width="164" height="181" fill="#27B71A"/>
                            <rect id="Rectangle 28" x="1342" y="930" width="230" height="215" fill="#27B71A"/>
                            <rect id="Rectangle 3" x="685" y="2035" width="1232" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 35" width="2783" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 2" x="16" y="2039" width="532" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 7" x="1886" y="1208" width="735" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 21" x="1886" y="653" width="617" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 31" x="1077" y="461" width="886" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 38" x="686" y="865" width="180" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 36" x="1046" y="668" width="386" height="31" transform="rotate(-90 1046 668)" fill="#27B71A"/>
                            <rect id="Rectangle 47" x="900" y="738" width="707" height="31" transform="rotate(-90 900 738)" fill="#27B71A"/>
                            <rect id="Rectangle 37" x="1951" y="491" width="210" height="31" transform="rotate(-90 1951 491)" fill="#27B71A"/>
                            <rect id="Rectangle 48" x="2055" y="234" width="210" height="31" transform="rotate(-90 2055 234)" fill="#27B71A"/>
                            <rect id="Rectangle 40" x="1248" y="668" width="183" height="31" transform="rotate(-90 1248 668)" fill="#27B71A"/>
                            <rect id="Rectangle 41" x="1479" y="668" width="183" height="31" transform="rotate(-90 1479 668)" fill="#27B71A"/>
                            <rect id="Rectangle 42" x="1267" y="940" width="210" height="31" transform="rotate(-90 1267 940)" fill="#27B71A"/>
                            <rect id="Rectangle 33" x="686" y="1784" width="889" height="32" transform="rotate(-90 686 1784)" fill="#27B71A"/>
                            <rect id="Rectangle 34" x="677" y="2039" width="193" height="49" transform="rotate(-90 677 2039)" fill="#27B71A"/>
                            <rect id="Rectangle 8" x="548" y="735" width="137" height="1341" fill="#D9D9D9"/>
                            <rect id="Rectangle 9" x="685" y="1784" width="963" height="62" fill="#D9D9D9"/>
                            <rect id="Rectangle 39" x="985" y="686" width="773" height="37" fill="#D9D9D9"/>
                            <rect id="Rectangle 45" x="1739" y="723" width="156" height="37" transform="rotate(-90 1739 723)" fill="#D9D9D9"/>
                            <rect id="Rectangle 46" x="1775" y="567" width="846" height="37" fill="#D9D9D9"/>
                            <rect id="Rectangle 32" x="931" y="203" width="1752" height="62" fill="#D9D9D9"/>
                            <rect id="Rectangle 16" x="419" y="1545" width="162" height="158" fill="#D9D9D9"/>
                            <rect id="Rectangle 10" x="1586" y="1839" width="1116" height="62" transform="rotate(-90 1586 1839)" fill="#D9D9D9"/>
                            <rect id="Rectangle 49" x="186" y="1545" width="1322" height="62" transform="rotate(-90 186 1545)" fill="#D9D9D9"/>
                            <rect id="Rectangle 26" x="1586" y="966" width="62" height="1035" transform="rotate(-90 1586 966)" fill="#D9D9D9"/>
                            <rect id="Rectangle 27" x="2621" y="1208" width="946" height="62" transform="rotate(-90 2621 1208)" fill="#D9D9D9"/>
                            <rect id="Rectangle 11" x="931" y="1839" width="1574" height="62" transform="rotate(-90 931 1839)" fill="#D9D9D9"/>
                            <rect id="Rectangle 4_2" x="2743" width="31" height="1208" fill="#27B71A"/>
                            <rect id="Rectangle 17" x="2070" y="1011" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 18" x="2284" y="1011" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 19" x="2070" y="684" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 24" x="1886" y="684" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 25" x="1886" y="1014" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 20" x="2284" y="684" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 22" x="2472" y="668" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 23" x="2472" y="1020" width="31" height="197" fill="#27B71A"/>
                            <rect id="Rectangle 43" x="1008" y="935" width="200" height="31" transform="rotate(-90 1008 935)" fill="#27B71A"/>
                            <rect id="Rectangle 44" x="1539" y="935" width="200" height="31" transform="rotate(-90 1539 935)" fill="#27B71A"/>
                            <rect id="Rectangle 54" x="718" y="554" width="187" height="181" fill="#27B71A"/>
                            <rect id="Rectangle 53" x="401" y="619" width="147" height="926" fill="#27B71A"/>
                            <rect id="Rectangle 51_2" x="548" y="767" width="160" height="168" transform="rotate(-90 548 767)" fill="#D9D9D9"/>
                            <rect id="Rectangle 48_2" x="2270" y="203" width="188" height="31" transform="rotate(-90 2270 203)" fill="#27B71A"/>
                            <rect id="Rectangle 49_2" x="2489" y="203" width="188" height="31" transform="rotate(-90 2489 203)" fill="#27B71A"/>
                            <rect id="Rectangle 31_2" x="2132" y="267" width="460" height="31" fill="#27B71A"/>
                            <rect id="Rectangle 37_2" x="2357" y="554" width="256" height="31" transform="rotate(-90 2357 554)" fill="#27B71A"/>
                            <rect id="Rectangle 46_2" x="2132" y="554" width="256" height="31" transform="rotate(-90 2132 554)" fill="#27B71A"/>
                            <rect id="Rectangle 47_2" x="2561" y="551" width="256" height="31" transform="rotate(-90 2561 551)" fill="#27B71A"/>
                            <rect id="Rectangle 45_2" x="2095" y="554" width="306" height="37" transform="rotate(-90 2095 554)" fill="#D9D9D9"/>
                            <rect id="Rectangle 9_2" x="666" y="735" width="268" height="62" fill="#D9D9D9"/>
                            <rect id="Rectangle 50_2" x="248" y="557" width="468" height="62" fill="#D9D9D9"/>
                            <rect id="Rectangle 52_2" x="248" y="225" width="603" height="103" fill="#D9D9D9"/>
                            <rect id="Rectangle 9_3" x="1648" y="1784" width="248" height="62" fill="#D9D9D9"/>
                        </g>
                        <rect id="product-43" x="892" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-37" x="1679" y="1747" width="77" height="148" transform="rotate(-90 1679 1747)" stroke="black" strokeWidth="4"/>
                        <rect id="product-34" x="1679" y="1378" width="77" height="148" transform="rotate(-90 1679 1378)" stroke="black" strokeWidth="4"/>
                        <rect id="product-31" x="1389" y="1624" width="77" height="148" transform="rotate(-90 1389 1624)" stroke="black" strokeWidth="4"/>
                        <rect id="product-32" x="1389" y="1747" width="77" height="148" transform="rotate(-90 1389 1747)" stroke="black" strokeWidth="4"/>
                        <rect id="product-30" x="1389" y="1501" width="77" height="148" transform="rotate(-90 1389 1501)" stroke="black" strokeWidth="4"/>
                        <path id="product-29" d="M1537 1301V1378H1389V1301H1537Z" stroke="black" strokeWidth="4"/>
                        <rect id="product-28" x="1389" y="1255" width="77" height="148" transform="rotate(-90 1389 1255)" stroke="black" strokeWidth="4"/>
                        <rect id="product-50" x="1953" y="1013" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-48" x="2359" y="1013" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-45" x="1953" y="697" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-3" x="1250" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-12" x="1393" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-11" x="1536" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-14" x="1107" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-9" x="1822" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-4" x="1393" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-5" x="1536" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-6" x="1679" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-7" x="1822" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-47" x="2359" y="697" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-46" x="2156" y="697" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-49" x="2156" y="1013" width="77" height="171" stroke="black" strokeWidth="4"/>
                        <rect id="product-33" x="1679" y="1255" width="77" height="148" transform="rotate(-90 1679 1255)" stroke="black" strokeWidth="4"/>
                        <rect id="product-35" x="1679" y="1501" width="77" height="148" transform="rotate(-90 1679 1501)" stroke="black" strokeWidth="4"/>
                        <rect id="product-36" x="1679" y="1624" width="77" height="148" transform="rotate(-90 1679 1624)" stroke="black" strokeWidth="4"/>
                        <rect id="product-44" x="761" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-21" x="757" y="1747" width="77" height="131" transform="rotate(-90 757 1747)" stroke="black" strokeWidth="4"/>
                        <rect id="product-22" x="1046" y="1747" width="77" height="131" transform="rotate(-90 1046 1747)" stroke="black" strokeWidth="4"/>
                        <rect id="product-27" x="1046" y="1132" width="77" height="131" transform="rotate(-90 1046 1132)" stroke="black" strokeWidth="4"/>
                        <rect id="product-26" x="1046" y="1255" width="77" height="131" transform="rotate(-90 1046 1255)" stroke="black" strokeWidth="4"/>
                        <rect id="product-68" x="67" y="1331" width="96" height="96" transform="rotate(-90 67 1331)" stroke="black" strokeWidth="4"/>
                        <rect id="product-64" x="67" y="945" width="96" height="96" transform="rotate(-90 67 945)" stroke="black" strokeWidth="4"/>
                        <rect id="product-65" x="67" y="1041" width="96" height="96" transform="rotate(-90 67 1041)" stroke="black" strokeWidth="4"/>
                        <rect id="product-70" x="67" y="1523" width="96" height="96" transform="rotate(-90 67 1523)" stroke="black" strokeWidth="4"/>
                        <rect id="product-69" x="67" y="1427" width="96" height="96" transform="rotate(-90 67 1427)" stroke="black" strokeWidth="4"/>
                        <rect id="product-66" x="67" y="1137" width="96" height="96" transform="rotate(-90 67 1137)" stroke="black" strokeWidth="4"/>
                        <rect id="product-67" x="67" y="1234" width="96" height="96" transform="rotate(-90 67 1234)" stroke="black" strokeWidth="4"/>
                        <rect id="product-77" x="284" y="1331" width="96" height="96" transform="rotate(-90 284 1331)" stroke="black" strokeWidth="4"/>
                        <rect id="product-73" x="284" y="945" width="96" height="96" transform="rotate(-90 284 945)" stroke="black" strokeWidth="4"/>
                        <rect id="product-74" x="284" y="1041" width="96" height="96" transform="rotate(-90 284 1041)" stroke="black" strokeWidth="4"/>
                        <rect id="product-79" x="284" y="1523" width="96" height="96" transform="rotate(-90 284 1523)" stroke="black" strokeWidth="4"/>
                        <rect id="product-78" x="284" y="1427" width="96" height="96" transform="rotate(-90 284 1427)" stroke="black" strokeWidth="4"/>
                        <rect id="product-75" x="284" y="1137" width="96" height="96" transform="rotate(-90 284 1137)" stroke="black" strokeWidth="4"/>
                        <rect id="product-76" x="284" y="1234" width="96" height="96" transform="rotate(-90 284 1234)" stroke="black" strokeWidth="4"/>
                        <rect id="product-63" x="67" y="849" width="96" height="96" transform="rotate(-90 67 849)" stroke="black" strokeWidth="4"/>
                        <rect id="product-71" x="284" y="754" width="96" height="96" transform="rotate(-90 284 754)" stroke="black" strokeWidth="4"/>
                        <rect id="product-72" x="284" y="850" width="96" height="96" transform="rotate(-90 284 850)" stroke="black" strokeWidth="4"/>
                        <rect id="product-61" x="67" y="655" width="96" height="96" transform="rotate(-90 67 655)" stroke="black" strokeWidth="4"/>
                        <rect id="product-81" x="267" y="199" width="116" height="116" transform="rotate(-90 267 199)" stroke="black" strokeWidth="4"/>
                        <rect id="product-84" x="616" y="199" width="116" height="116" transform="rotate(-90 616 199)" stroke="black" strokeWidth="4"/>
                        <rect id="product-85" x="732" y="199" width="116" height="116" transform="rotate(-90 732 199)" stroke="black" strokeWidth="4"/>
                        <rect id="product-83" x="500" y="199" width="116" height="116" transform="rotate(-90 500 199)" stroke="black" strokeWidth="4"/>
                        <rect id="product-82" x="384" y="199" width="116" height="116" transform="rotate(-90 384 199)" stroke="black" strokeWidth="4"/>
                        <rect id="product-89" x="268" y="489" width="116" height="116" transform="rotate(-90 268 489)" stroke="black" strokeWidth="4"/>
                        <rect id="product-87" x="617" y="489" width="116" height="116" transform="rotate(-90 617 489)" stroke="black" strokeWidth="4"/>
                        <rect id="product-80" x="57" y="349" width="116" height="116" transform="rotate(-90 57 349)" stroke="black" strokeWidth="4"/>
                        <rect id="product-86" x="733" y="489" width="116" height="116" transform="rotate(-90 733 489)" stroke="black" strokeWidth="4"/>
                        <rect id="product-90" x="501" y="489" width="116" height="116" transform="rotate(-90 501 489)" stroke="black" strokeWidth="4"/>
                        <rect id="product-88" x="385" y="489" width="116" height="116" transform="rotate(-90 385 489)" stroke="black" strokeWidth="4"/>
                        <rect id="product-62" x="67" y="752" width="96" height="96" transform="rotate(-90 67 752)" stroke="black" strokeWidth="4"/>
                        <rect id="product-25" x="1046" y="1378" width="77" height="131" transform="rotate(-90 1046 1378)" stroke="black" strokeWidth="4"/>
                        <rect id="product-23" x="1046" y="1624" width="77" height="131" transform="rotate(-90 1046 1624)" stroke="black" strokeWidth="4"/>
                        <rect id="product-24" x="1046" y="1501" width="77" height="131" transform="rotate(-90 1046 1501)" stroke="black" strokeWidth="4"/>
                        <rect id="product-15" x="757" y="1009" width="77" height="131" transform="rotate(-90 757 1009)" stroke="black" strokeWidth="4"/>
                        <rect id="product-18" x="757" y="1378" width="77" height="131" transform="rotate(-90 757 1378)" stroke="black" strokeWidth="4"/>
                        <rect id="product-17" x="757" y="1255" width="77" height="131" transform="rotate(-90 757 1255)" stroke="black" strokeWidth="4"/>
                        <rect id="product-16" x="757" y="1132" width="77" height="131" transform="rotate(-90 757 1132)" stroke="black" strokeWidth="4"/>
                        <rect id="product-20" x="757" y="1624" width="77" height="131" transform="rotate(-90 757 1624)" stroke="black" strokeWidth="4"/>
                        <rect id="product-19" x="757" y="1501" width="77" height="131" transform="rotate(-90 757 1501)" stroke="black" strokeWidth="4"/>
                        <rect id="product-39" x="1416" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-38" x="1547" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-40" x="1285" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-42" x="1023" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-41" x="1154" y="1877" width="77" height="148" stroke="black" strokeWidth="4"/>
                        <rect id="product-8" x="1965" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-10" x="1679" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-2" x="1107" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-1" x="964" y="60" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <rect id="product-13" x="1250" y="283" width="77" height="116" stroke="black" strokeWidth="4"/>
                        <g id="product-53">
                            <rect id="product-157" x="1589" y="513" width="56" height="131" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1" d="M1616.5 672L1602.21 643.5H1630.79L1616.5 672Z" fill="black"/>
                        </g>
                        <g id="product-57">
                            <rect id="product-156" x="2471" y="324" width="56" height="106" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_2" d="M2498.5 461L2484.21 432.5H2512.79L2498.5 461Z" fill="black"/>
                        </g>
                        <g id="product-56">
                            <rect id="product-158" x="2226" y="324" width="56" height="106" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_3" d="M2253.5 461L2239.21 432.5H2267.79L2253.5 461Z" fill="black"/>
                        </g>
                        <g id="product-60">
                            <rect id="product-151" x="2167" y="60" width="56" height="86" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_4" d="M2194.5 178L2180.21 149.5H2208.79L2194.5 178Z" fill="black"/>
                        </g>
                        <g id="product-58">
                            <rect id="product-155" x="2563" y="52" width="56" height="86" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_5" d="M2590.5 170L2576.21 141.5H2604.79L2590.5 170Z" fill="black"/>
                        </g>
                        <g id="product-59">
                            <rect id="product-152" x="2390" y="60" width="56" height="86" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_6" d="M2417.5 178L2403.21 149.5H2431.79L2417.5 178Z" fill="black"/>
                        </g>
                        <g id="product-52">
                            <rect id="product-149" x="1344" y="513" width="56" height="131" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_7" d="M1374.5 675L1360.21 646.5H1388.79L1374.5 675Z" fill="black"/>
                        </g>
                        <g id="product-55">
                            <rect id="product-150" x="1445" y="912" width="56" height="131" transform="rotate(-180 1445 912)" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_8" d="M1418.5 757L1432.79 785.5H1404.21L1418.5 757Z" fill="black"/>
                        </g>
                        <g id="product-54">
                            <rect id="product-153" x="1195" y="912" width="56" height="131" transform="rotate(-180 1195 912)" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_9" d="M1166.5 757L1180.79 785.5H1152.21L1166.5 757Z" fill="black"/>
                        </g>
                        <g id="product-51">
                            <rect id="product-154" x="1128" y="513" width="56" height="131" stroke="black" strokeWidth="4"/>
                            <path id="Polygon 1_10" d="M1155.5 675L1141.21 646.5H1169.79L1155.5 675Z" fill="black"/>
                        </g>
                    </g>
                    <defs>
                        <clipPath id="clip0_1_2">
                            <rect width="2774" height="2065" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>
            </div>

            {/* LÉGENDE MISE À JOUR */}
            <div className="flex justify-center gap-4 md:gap-6 mt-8 text-sm font-bold text-slate-600 flex-wrap">
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-500"></span> 2 à 3 pers.</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-emerald-500"></span> 4 pers.</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-500"></span> 5 pers.</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-purple-500"></span> 6 à 8 pers.</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500"></span> Loué / Réservé</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#334155]"></span> Déjà Vendu</span>
            </div>
        </div>
    );
};

export default CampingMap;