# Relatórios E3

Site estático dos relatórios de redes sociais da E3 (skin amarelo e preto).

- `prefeituras/hortolandia/`: página única do cliente. Semanal, Diário e Mensal trocam os dados na mesma página (`?r=semanal/2026-11-16`).
- `design-system/e3/`: motor do relatório (`relatorio-e3.js`/`.css`), motor de rolagem scroll-craft (sem edição) e marcas E3.
- Cada edição tem `dados.trancado.js` (AES-GCM 256, PBKDF2). O `dados.js` aberto nunca entra no repositório.
- Exportar PDF: menu de opções, destino "Salvar como PDF", com "Gráficos de fundo" ligado. Cada seção vira uma página A4 deitada.
