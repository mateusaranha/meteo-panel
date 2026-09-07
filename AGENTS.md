# AGENTS.md

Este arquivo fornece contexto operacional para agentes de código que forem trabalhar no MeteoPanel em conversas futuras.

## Visão geral

MeteoPanel é um dashboard meteorológico pessoal, estático e client-side. O objetivo principal é reunir, em uma única página, fontes que normalmente seriam consultadas separadamente.

O projeto deve permanecer simples o suficiente para ser hospedado diretamente no GitHub Pages.

## Estado funcional atual

A ordem atual dos módulos na página é intencional:

1. **Windy** — mapa meteorológico interativo;
2. **Open-Meteo** — resumo geral de condições atuais e previsão dos próximos dias;
3. **Vento agora — Aldeia da Conceição** — observação local da Windguru Station `6023`, com leitura atual e gráfico recente;
4. **Windguru** — widget técnico de previsão para o spot fixo de Florianópolis;
5. **Temperatura do mar** — módulo de uso mais ocasional, mantido como último card da página.

### Vento agora — Aldeia da Conceição

- Estação atual: **Windguru Station `6023`**, identificada como “Aldeia da conceição, Aldeia”.
- Objetivo: complementar previsões com uma medição local real no ponto onde o veleiro fica guardado.
- Usar integração oficial Windguru Station/Windguru Live; **não fazer scraping** da página da Aldeia ou da página da estação.
- O painel atual usa `WgsWidget(..., type: "curr")` para leitura atual e `wglive.php` para o gráfico.
- Em desktop, leitura atual e gráfico ficam lado a lado.
- Em mobile, os dois painéis usam rolagem horizontal com `scroll-snap`; a leitura atual aparece primeiro.
- O proprietário da estação pode restringir os domínios autorizados para embed. Se o widget não carregar, manter um fallback explícito com link para a estação original.
- Não permitir uma falha deste módulo derrubar os demais.

### Windguru

- Spot atual: **Florianópolis (`105160`)**.
- Mostrar vento, rajadas, direção, temperatura, nebulosidade e precipitação.
- **Não mostrar `Wave (m)`** na configuração atual.
- **Não oferecer seletor/favoritos de locais do Windguru** na configuração atual.
- O usuário já experimentou essas duas funcionalidades e decidiu removê-las.
- Não reintroduzi-las sem pedido explícito.

### Temperatura do mar

- Usa **Open-Meteo Marine API** para `sea_surface_temperature`.
- O módulo possui favoritos próprios e persistência em `localStorage`.
- É possível adicionar, selecionar, editar e remover locais.
- A busca por nome usa geocodificação do Nominatim/OpenStreetMap.
- O fluxo de criação deve sempre separar **buscar/verificar** de **salvar**.
- Pressionar Enter na busca deve pesquisar, não adicionar imediatamente um favorito.
- Antes de salvar, o usuário deve poder conferir o resultado no mapa, endereço/rótulo e coordenadas.
- O mapa usa Leaflet + OpenStreetMap.
- Temperatura exibida é modelada, não medição in situ.
- Águas interiores/reservatórios estão deliberadamente fora do escopo por enquanto.

## Princípios técnicos

Preservar, salvo pedido explícito em contrário:

- HTML, CSS e JavaScript puro;
- nenhuma etapa de build;
- nenhum framework de aplicação;
- nenhum backend;
- nenhum banco de dados;
- nenhum login;
- nenhuma chave secreta no cliente;
- compatibilidade direta com GitHub Pages;
- `localStorage` para preferências/favoritos locais simples;
- layout responsivo para desktop e celular;
- falhas de um serviço externo não devem derrubar os outros módulos.

Evite overengineering. Não introduza React, Vue, bundlers, npm, servidor, banco ou autenticação apenas por conveniência de implementação.

## Estrutura relevante

- `index.html` — estrutura e ordem dos cards/modais.
- `styles.css` — estilos gerais do dashboard.
- `aldeia-live.css` — estilos e responsividade do módulo de vento local.
- `marine-search.css` — estilos específicos da busca/seleção de locais marítimos.
- `config.js` — configuração central do local padrão, estação local, Windy, Windguru e defaults do módulo marítimo.
- `app.js` — cabeçalho, Windy e Open-Meteo geral.
- `aldeia-live.js` — carregamento isolado dos widgets Windguru Station/Windguru Live da estação `6023`.
- `windguru.js` — carregamento isolado do widget Windguru de previsão.
- `marine.js` — favoritos marítimos, busca, mapa, geocodificação e temperatura do mar.
- `README.md` — documentação pública principal.
- `THIRD_PARTY_NOTICES.md` — licenças, termos e ressalvas de terceiros.
- `LICENSE` — MIT para o código/documentação original do MeteoPanel.

## Serviços externos e licenciamento

A licença MIT do repositório cobre apenas o código e a documentação original do MeteoPanel.

Não assumir que dados, widgets, tiles, mapas, marcas ou APIs de terceiros são MIT. Antes de alterar ou adicionar uma integração externa:

1. verificar os termos/licença atuais do provedor;
2. manter atribuições exigidas;
3. atualizar `THIRD_PARTY_NOTICES.md` quando necessário;
4. considerar CORS, rate limits, disponibilidade, permissões de domínio e falhas;
5. não adicionar scraping quando existe uma integração oficial adequada;
6. não colocar chaves privadas ou credenciais no repositório.

Integrações atuais incluem Windy, Windguru Forecast, Windguru Station/Windguru Live, Open-Meteo, Leaflet, OpenStreetMap e Nominatim.

O Nominatim público deve ser usado apenas para buscas explícitas disparadas pelo usuário; não implementar autocomplete agressivo contra o serviço público.

## Preferências de UX já estabelecidas

- Priorizar consulta rápida e baixa poluição visual.
- Não exibir informação ou controles apenas porque são tecnicamente possíveis.
- Preferir ações explícitas quando um erro de seleção pode gerar dado incorreto.
- Evitar salvar automaticamente um local antes de o usuário confirmar que o ponto é o correto.
- Manter a temperatura do mar no final da página.
- Para o módulo da Aldeia: leitura atual primeiro; gráfico secundário. Em mobile, preferir gesto lateral a empilhar dois blocos grandes verticalmente.
- Preferir módulos independentes e pequenos a um único script que possa quebrar toda a aplicação.

## Fluxo de Git e pull requests

A partir de setembro de 2026, novas funcionalidades e mudanças relevantes devem preferencialmente ser feitas por **branch + pull request**, em vez de commits diretos no `main`.

Fluxo esperado:

1. inspecionar `main` e ler este arquivo;
2. criar uma branch curta e descritiva a partir de `main`;
3. fazer commits pequenos e coerentes na branch;
4. validar o que for possível antes da PR;
5. abrir PR para `main` com resumo, decisões de UX, riscos/limitações e plano de teste;
6. não fazer merge automaticamente sem pedido explícito do proprietário.

Correções triviais podem usar fluxo diferente se o usuário pedir explicitamente.

## Como trabalhar em uma tarefa

Antes de editar:

1. inspecione o estado atual da branch/repositório;
2. leia os arquivos diretamente relacionados à mudança;
3. preserve o que já estiver tecnicamente correto;
4. evite reescrever áreas não relacionadas;
5. cheque se a mudança contradiz alguma decisão registrada neste arquivo.

Depois de editar:

- valide sintaxe de JavaScript quando possível;
- confirme que referências de arquivos e cache-busting continuam coerentes;
- verifique desktop e mobile quando a mudança afetar layout;
- preserve estados de erro/fallback dos provedores externos;
- atualize `README.md` e/ou `THIRD_PARTY_NOTICES.md` somente quando a mudança realmente alterar comportamento, arquitetura ou dependências.

## Execução local

Não há instalação nem build.

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Manutenção do projeto

Este repositório é mantido principalmente pelo proprietário. Não é necessário criar infraestrutura de colaboração, templates ou processos de contribuição sem pedido explícito.

Prefira commits e mudanças pequenas, claras e proporcionais ao problema solicitado.
