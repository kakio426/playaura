import React from 'react';
import { Shield, FileText, ExternalLink, Mail, ArrowLeft, CheckCircle, Zap } from 'lucide-react';

interface TermsProps {
    onBack: () => void;
}

export const Terms: React.FC<TermsProps> = ({ onBack }) => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const sections = [
        { id: 'purpose', title: '제 1 조 (목적)' },
        { id: 'youtube-api', title: '제 2 조 (YouTube API 이용)' },
        { id: 'intellectual-property', title: '제 3 조 (지식재산권)' },
        { id: 'user-conduct', title: '제 4 조 (이용자 준수사항)' },
        { id: 'disclaimer', title: '제 5 조 (면책 및 한계)' },
        { id: 'privacy', title: '제 6 조 (개인정보 보호)' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans selection:bg-red-500/30 transition-colors duration-500">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-black/5 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-600 p-2 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight text-black dark:text-white block">PlayAura</span>
                            <span className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest font-black">Legal & Privacy</span>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm text-black/40 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all active:scale-95 border border-black/5 dark:border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-16">
                {/* Sidebar Navigation */}
                <aside className="md:w-72 shrink-0">
                    <div className="sticky top-32 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-black/20 dark:text-white/20 uppercase tracking-[0.2em] mb-6 px-4">Navigation</h3>
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-black/40 dark:text-white/40 transition-all hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white group flex items-center justify-between border border-transparent hover:border-black/5 dark:hover:border-white/5"
                                    >
                                        {section.title}
                                        <CheckCircle className="w-4 h-4 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity" />
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] rounded-[2rem] border border-black/5 dark:border-white/5">
                            <p className="text-[10px] text-black/20 dark:text-white/20 font-black uppercase tracking-widest mb-2">Last Updated</p>
                            <p className="text-sm text-black/60 dark:text-white/60 font-mono italic">2025.12.27</p>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <article className="flex-1 space-y-24 pb-32">
                    <section className="relative">
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] -z-10" />
                        <h1 className="text-5xl md:text-6xl font-black text-black dark:text-white mb-8 tracking-tighter">서비스 이용약관</h1>
                        <p className="text-xl text-black/40 dark:text-white/40 leading-relaxed font-medium">
                            PlayAura 서비스를 이용해 주셔서 감사합니다. 본 약관은 이용자가 PlayAura가 제공하는 유튜버 추천 및 데이터 분석 서비스를 이용함에 있어 필요한 권리, 의무 및 책임사항을 규정합니다.
                        </p>
                    </section>

                    {/* Section 1 */}
                    <section id="purpose" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            제 1 조 (목적)
                        </h2>
                        <div className="space-y-6 text-black/60 dark:text-white/60 leading-8 text-lg">
                            <p>본 약관은 PlayAura(이하 "서비스")가 제공하는 웹 서비스의 이용 조건 및 절차에 관한 기본적인 사항을 정함을 목적으로 합니다.</p>
                            <p>본 서비스는 YouTube의 공개 데이터를 기반으로 한 채널 추천, 랭킹 및 분석 정보를 제공하며, 사용자는 본 서비스를 이용함으로써 본 약관에 동의하게 됩니다.</p>
                        </div>
                    </section>

                    {/* Section 2 - CRITICAL FOR YOUTUBE API */}
                    <section id="youtube-api" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-red-500" />
                            </div>
                            제 2 조 (YouTube API 이용 및 동의)
                        </h2>
                        <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-10 space-y-6 text-black/60 dark:text-white/60 leading-8 text-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <Zap className="w-12 h-12 text-red-600/20" />
                            </div>
                            <p className="font-black text-white uppercase tracking-widest text-sm py-1 px-3 bg-red-600 inline-block rounded-lg mb-4">중요 공지</p>
                            <p>1. PlayAura는 **YouTube Data API Services**를 활용하여 데이터를 제공하는 API 클라이언트입니다.</p>
                            <p>2. 귀하는 본 서비스를 이용함으로써 다음의 약관 및 정책의 적용을 받는 것에 동의하게 됩니다:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="group p-6 bg-black/5 dark:bg-white/5 rounded-[1.5rem] hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/10">
                                    <p className="text-[10px] text-black/30 dark:text-white/30 font-black uppercase tracking-widest mb-2">Platform Policy</p>
                                    <p className="font-bold text-black dark:text-white flex items-center gap-2 group-hover:text-red-500 transition-colors">
                                        YouTube 서비스 약관 <ExternalLink className="w-4 h-4" />
                                    </p>
                                </a>
                                <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="group p-6 bg-black/5 dark:bg-white/5 rounded-[1.5rem] hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/10">
                                    <p className="text-[10px] text-black/30 dark:text-white/30 font-black uppercase tracking-widest mb-2">Privacy Standards</p>
                                    <p className="font-bold text-black dark:text-white flex items-center gap-2 group-hover:text-red-500 transition-colors">
                                        Google 개인정보보호정책 <ExternalLink className="w-4 h-4" />
                                    </p>
                                </a>
                            </div>
                            <p className="mt-6">3. 본 서비스는 YouTube 서버에서 직접 실시간 데이터를 호출하며, 데이터의 원천 권한은 YouTube에 있습니다.</p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section id="intellectual-property" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8">제 3 조 (지식재산권 및 저작권)</h2>
                        <div className="space-y-6 text-black/60 dark:text-white/60 leading-8 text-lg">
                            <p>1. 본 서비스에서 노출되는 모든 유튜브 채널의 이름, 로고, 영상 썸네일, 채널 아트 및 영상 내용은 각 채널 운영자(저작권자) 및 YouTube의 독점적 자산입니다.</p>
                            <p>2. PlayAura는 정보를 분류하고 추천하는 '큐레이션 서비스'를 제공할 뿐이며, 해당 콘텐츠에 대한 저작권을 소유하지 않습니다.</p>
                            <p>3. 사용자는 서비스에서 제공하는 정보를 저작권자의 허락 없이 무단으로 복제, 배포, 전시 또는 상업적으로 이용해서는 안 됩니다.</p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section id="user-conduct" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8">제 4 조 (이용자 준수사항)</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                "서비스의 운영을 방해하거나 서버에 과도한 부하를 주는 행위",
                                "YouTube API 서비스의 약관을 위반하여 데이터를 수집하거나 가공하는 행위",
                                "서비스가 제공하는 데이터 분석 지표를 조작하거나 허위 사실을 유포하는 행위",
                                "타인의 개인정보를 무단으로 수집하거나 도용하는 행위"
                            ].map((text, idx) => (
                                <li key={idx} className="p-6 bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl text-black/60 dark:text-white/60 leading-relaxed font-medium">
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 5 */}
                    <section id="disclaimer" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8">제 5 조 (면책 및 한계)</h2>
                        <div className="space-y-8">
                            <div className="p-8 bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[2rem]">
                                <p className="text-black/60 dark:text-white/60 leading-8 text-lg">
                                    1. PlayAura가 제공하는 데이터(구독자 수 변화, 성장률, 랭킹 등)는 통계적 추정치이며 실제 YouTube 공식 스튜디오의 데이터와 오차가 발생할 수 있습니다.
                                </p>
                            </div>
                            <div className="p-8 bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[2rem]">
                                <p className="text-black/60 dark:text-white/60 leading-8 text-lg">
                                    2. YouTube API의 정책 변경이나 서비스 장애로 인해 데이터 노출이 중단될 수 있으며, 이에 대해 서비스는 책임을 지지 않습니다.
                                </p>
                            </div>
                            <div className="p-8 bg-black/[0.01] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[2rem]">
                                <p className="text-black/60 dark:text-white/60 leading-8 text-lg">
                                    3. 추천된 채널의 콘텐츠 내용이나 품질, 적법성에 대해 PlayAura는 어떠한 보증도 하지 않으며 사용자의 시청 판단에 따른 결과는 사용자 본인에게 있습니다.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section id="privacy" className="scroll-mt-32">
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-500" />
                            </div>
                            제 6 조 (개인정보 처리 및 보안)
                        </h2>
                        <div className="space-y-6 text-black/60 dark:text-white/60 leading-8 text-lg">
                            <p>1. PlayAura는 기본적으로 사용자의 개인 식별 정보를 저장하지 않습니다.</p>
                            <p>2. 서비스 품질 향상을 위해 쿠키(Cookie)나 구글 애널리틱스 등 익명화된 방문 데이터를 활용할 수 있습니다.</p>
                            <p>3. API 이용 과정에서 발생하는 데이터 처리는 Google의 보안 정책을 따릅니다.</p>
                        </div>
                    </section>

                    {/* Footer of Article */}
                    <div className="pt-20 border-t border-black/5 dark:border-white/5">
                        <div className="bg-red-600 p-12 rounded-[3rem] text-center space-y-6 shadow-[0_40px_100px_-20px_rgba(220,38,38,0.3)]">
                            <Mail className="w-12 h-12 text-white mx-auto mb-4" />
                            <h4 className="text-3xl font-black text-white">약관 관련 문의</h4>
                            <p className="text-white/80 max-w-md mx-auto font-medium">내용에 의문이 있거나 권리 침해 신고가 필요한 경우 아래 메일로 연락주세요.</p>
                            <a href="mailto:kakio@naver.com" className="inline-block px-10 py-4 bg-white text-red-600 rounded-2xl font-black text-lg hover:scale-105 transition-transform">
                                kakio@naver.com
                            </a>
                        </div>
                    </div>
                </article>
            </main>

            <div className="px-6 py-10 flex justify-center text-[10px] font-mono text-black/20 dark:text-white/20 uppercase tracking-[0.3em]">
                YouTube is a trademark of Google LLC.
            </div>
        </div>
    );
};
