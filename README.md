# MeteoPanel

MeteoPanel é um dashboard meteorológico estático para reunir, em uma única página, diferentes formas de consultar o tempo e as condições do mar.

O projeto nasceu para um uso cotidiano simples: evitar abrir vários sites separadamente para comparar previsões. Ele permanece deliberadamente leve, sem backend, conta de usuário, banco de dados ou framework de aplicação.

> **Importante:** a licença MIT deste repositório cobre o **código original do MeteoPanel**. Dados, mapas, widgets, marcas e serviços de terceiros continuam sujeitos às licenças e termos dos respectivos provedores. Leia [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) antes de redistribuir, publicar em escala ou comercializar uma versão do projeto.

## O que o painel mostra

Na configuração atual, a página apresenta:

1. **Windy** — mapa meteorológico interativo;
2. **Open-Meteo** — resumo geral com condições atuais e previsão dos próximos dias;
3. **Windguru** — tabela técnica de vento, rajadas, direção, temperatura, nebulosidade e precipitação para o spot configurado;
4. **Vento agora — Aldeia da Conceição** — observação local da Windguru Station `6023`, com leitura atual e gráfico recente;
5. **Temperatura do mar** — módulo de consulta de temperatura superficial estimada com locais favoritos.

O local meteorológico principal configurado atualmente é **Florianópolis, SC**. O Windguru de previsão usa o spot `105160`.

## Temas visuais

O cabeçalho possui um seletor de tema com quatro opções:

- **Automático** — segue a preferência `prefers-color-scheme` do sistema operacional;
- **Claro** — força a aparência clara tradicional do MeteoPanel;
- **Ocean Night** — tema escuro marítimo com fundo navy, superfícies azul-petróleo e accent turquesa;
- **Coastal Light** — tema claro marítimo com superfícies luminosas, azul oceânico e tipografia azul-marinho.

A preferência é salva localmente no navegador em `localStorage` (`meteopanel-theme-v1`). Não existe sincronização de tema entre dispositivos.

A implementação base fica isolada em `theme.js` e `theme.css`; a paleta específica do Coastal Light fica em `coastal-light.css`. A camada visual tematiza apenas elementos controlados pelo MeteoPanel; conteúdo interno de widgets/iframes cross-origin continua com a aparência definida pelos respectivos provedores.

## Vento agora — Aldeia da Conceição

Este módulo complementa as previsões com uma **medição local** da estação meteorológica da Aldeia da Conceição, identificada no Windguru como estação `6023`.

A integração usa os widgets oficiais do Windguru Station/Windguru Live:

- `WgsWidget(..., type: "curr")` para a leitura atual;
- `wglive.php` para o gráfico recente.

A estação `6023` foi validada no domínio publicado do GitHub Pages em setembro de 2026.

### Limitação do widget atual

A leitura “Agora” é renderizada pelo Windguru dentro de um **iframe cross-origin**. Por segurança do navegador, o JavaScript do MeteoPanel não pode ler nem modificar o DOM interno desse iframe.

Uma tentativa anterior de montar uma apresentação própria a partir dos campos internos do widget foi removida depois de se confirmar essa limitação. O MeteoPanel mantém o widget oficial como fonte visual e melhora somente o que pode controlar com segurança ao redor dele.

A apresentação atual trata a estação como **um único módulo vertical**:

- a leitura “Agora” aparece primeiro em uma faixa compacta;
- a identificação da estação fica na mesma faixa, sem criar uma segunda coluna alta;
- o gráfico de vento recente vem logo abaixo e ocupa toda a largura disponível;
- o gráfico usa uma configuração de altura mais contida para não dominar a página;
- em telas menores, os elementos permanecem empilhados na mesma ordem, sem carrossel horizontal.

Essa organização evita o grande espaço vazio que surgia quando a leitura curta e o gráfico alto eram colocados lado a lado.

O módulo é isolado dos demais. Se o Windguru estiver indisponível, o MeteoPanel mostra um fallback com link para a página original da estação sem interromper Windy, Open-Meteo, Windguru de previsão ou temperatura do mar.

A rede Windguru Station informa que as estações podem enviar medições em intervalos de aproximadamente um minuto; o horário e a disponibilidade efetivos continuam sendo responsabilidade do provedor/estação.

## Temperatura do mar

O módulo marítimo usa a API Marine do Open-Meteo e permite:

- pesquisar um local por nome;
- conferir o resultado no mapa **antes** de salvá-lo;
- escolher ou ajustar o ponto diretamente no mapa;
- definir um nome curto para o favorito;
- alternar entre locais salvos;
- editar ou remover favoritos;
- consultar a temperatura superficial estimada do mar no ponto selecionado.

Os favoritos ficam no `localStorage` do navegador. Isso preserva a arquitetura sem backend e mantém o painel funcional mesmo sem qualquer serviço de conta/sincronização.

### Transferência e backup de favoritos

O botão **Transferir** permite levar a lista de locais para outro dispositivo sem login ou backend:

- **Copiar link** — gera um link do MeteoPanel contendo uma cópia compacta dos nomes e coordenadas dos favoritos;
- **Mostrar QR code** — gera localmente um QR code do mesmo link, útil para abrir a lista em outro celular/computador;
- **Exportar arquivo** — baixa um backup JSON versionado;
- **Importar arquivo** — lê um backup JSON e mostra uma prévia antes de alterar a lista local.

Ao abrir um link de transferência, o MeteoPanel mostra os locais encontrados e exige confirmação. **Mesclar favoritos** é a ação principal e mantém os locais já existentes, adicionando apenas coordenadas novas. **Substituir tudo** é uma ação explícita e pede confirmação adicional.

A transferência é uma **cópia pontual**, não sincronização automática. Se um favorito for adicionado depois no celular, ele não aparecerá sozinho no computador: é necessário transferir novamente.

Os dados do link ficam no fragmento `#marine=...` da URL e são processados no navegador. O MeteoPanel remove esse fragmento da barra de endereço assim que o interpreta. O link não deve ser tratado como segredo: qualquer pessoa que o receba pode recuperar os nomes e coordenadas incluídos nele.

Há um favorito inicial de exemplo chamado **Campeche**, que pode ser editado ou removido.

A temperatura exibida é **modelada**. Ela não deve ser interpretada como uma medição in situ exata na areia, no ponto de entrada da água ou ao longo de uma travessia.

## Arquitetura

O MeteoPanel é uma aplicação client-side sem etapa de build:

```text
meteo-panel/
├── index.html                 # estrutura da interface
├── styles.css                 # estilos gerais
├── theme.css                  # design tokens e temas visuais base
├── coastal-light.css          # paleta e overrides do tema Coastal Light
├── theme.js                   # preferência/persistência do tema
├── aldeia-live.css            # layout da estação local e responsividade
├── marine-search.css          # estilos da busca/seleção marítima
├── marine-transfer.css        # estilos de transferência/importação de favoritos
├── config.js                  # configuração central
├── app.js                     # cabeçalho, Windy e Open-Meteo
├── aldeia-live.js             # widgets oficiais da estação local
├── windguru.js                # carregamento isolado do widget Windguru de previsão
├── marine.js                  # favoritos, mapa, geocodificação e temperatura do mar
├── marine-transfer.js         # link, QR, exportação e importação de favoritos
├── README.md                  # documentação principal
├── AGENTS.md                  # contexto operacional para agentes de código
├── THIRD_PARTY_NOTICES.md     # licenças/termos dos serviços externos
└── LICENSE                    # licença MIT do código original
```

### Princípios do projeto

- HTML, CSS e JavaScript puro;
- sem backend;
- sem banco de dados;
- sem login;
- sem chaves secretas no cliente;
- compatível com hospedagem estática, incluindo GitHub Pages;
- falhas de um provedor devem ficar isoladas e não derrubar os demais módulos;
- preferências locais simples são mantidas no navegador.

## Fontes e dependências externas

O projeto atualmente se integra com:

- **Windy** — visualização meteorológica incorporada;
- **Windguru** — widget de previsão para um spot configurado;
- **Windguru Station / Windguru Live** — observação local da estação `6023` da Aldeia da Conceição e gráfico recente;
- **Open-Meteo Forecast API** — previsão geral;
- **Open-Meteo Marine API** — temperatura superficial do mar;
- **OpenStreetMap** — dados/mapa usados na seleção de pontos;
- **Nominatim** — geocodificação de buscas explícitas feitas pelo usuário;
- **Leaflet 1.9.4** — biblioteca JavaScript para o mapa interativo;
- **QRCode.js 1.0.0** — geração client-side de QR codes para transferir favoritos; carregada sob demanda.

Esses componentes **não passam a ser MIT** por aparecerem no MeteoPanel. Consulte [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) para detalhes, atribuições, restrições de uso e links para os termos atuais.

### Ressalva sobre uso comercial

A licença MIT permite uso comercial do **código original do MeteoPanel**, mas isso não significa que a configuração atual de serviços externos possa ser usada comercialmente sem alterações.

Por exemplo, a API gratuita do Open-Meteo possui condições próprias para uso não comercial, e o Windy possui regras específicas para seu widget incorporável. Um fork comercial deve revisar cada integração e, quando necessário, contratar o plano apropriado, obter permissão ou substituir/remover o provedor.

## Segurança e uso responsável

MeteoPanel é uma ferramenta de consulta, não um sistema de segurança, navegação ou emergência.

Previsões e medições meteorológicas podem estar incorretas, atrasadas, incompletas ou indisponíveis. Uma estação local também pode sofrer obstruções, falhas de sensor, problemas de transmissão ou não representar as condições em toda a Lagoa da Conceição.

Não use o painel como única fonte para decidir sobre travessias a nado, velejadas, navegação ou outras situações em que condições meteorológicas e marítimas possam representar risco.

Consulte fontes oficiais/locais adequadas, condições observadas e procedimentos de segurança próprios para a atividade.

## Privacidade

Não há conta de usuário nem backend do MeteoPanel. Entretanto, por ser uma aplicação client-side que consome serviços externos, o navegador faz requisições diretamente aos provedores.

Dependendo do recurso utilizado, terceiros podem receber metadados normais de rede, como endereço IP, informações do navegador e referrer, de acordo com as próprias políticas de privacidade desses serviços. Termos pesquisados no módulo de locais são enviados ao serviço de geocodificação utilizado.

A geração de QR code é feita no navegador pela biblioteca QRCode.js; não é usado um serviço remoto de criação de QR que receba a lista de favoritos. A biblioteca é carregada sob demanda de um CDN de terceiros, conforme descrito em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Rodar localmente

Como a aplicação carrega recursos externos, sirva os arquivos por HTTP em vez de abrir `index.html` diretamente pelo sistema de arquivos.

Com Python:

```bash
python -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

Não há `npm install`, compilação ou etapa de build.

## Configuração

A configuração principal fica em [`config.js`](config.js). Nela é possível alterar:

- nome do aplicativo;
- local meteorológico padrão;
- latitude, longitude e zoom do Windy;
- modelo/camada do Windy;
- spot e unidades do Windguru de previsão;
- ID, unidades e URL da estação local da Aldeia;
- chaves de `localStorage` do módulo marítimo;
- favoritos marítimos usados como padrão antes de existir configuração salva no navegador.

## GitHub Pages

O projeto pode ser publicado diretamente a partir da raiz da branch `main`:

1. abra **Settings → Pages**;
2. selecione publicação a partir de uma branch;
3. escolha `main` e `/ (root)`;
4. salve.

Não há etapa de build.

## Limitações conhecidas

- os favoritos marítimos continuam locais ao navegador/dispositivo; transferência e backup não são sincronização automática;
- links de transferência contêm nomes e coordenadas dos favoritos e não devem ser tratados como informação secreta;
- integrações externas podem mudar ou deixar de funcionar sem alteração no MeteoPanel;
- a disponibilidade do Windy/Windguru depende dos widgets e regras dos próprios serviços;
- o interior do iframe da leitura atual da estação não pode ser customizado pelo MeteoPanel por causa da política de mesma origem do navegador;
- uma estação local representa as condições no ponto onde o sensor está instalado, não necessariamente em toda a região;
- a temperatura do mar é um valor modelado;
- o uso dos serviços públicos OpenStreetMap/Nominatim deve permanecer dentro das políticas de uso dos respectivos projetos;
- um projeto com tráfego relevante deve reavaliar APIs, tiles, geocodificação, limites e termos antes de escalar.

## Para agentes de código

O repositório inclui [`AGENTS.md`](AGENTS.md), com contexto operacional e decisões já tomadas sobre arquitetura, UX e integrações externas. Ele existe para evitar que um novo agente precise reconstruir a história do projeto a cada conversa.

## Licença

O **código original e a documentação original do MeteoPanel** são disponibilizados sob a **MIT License**. Veja [`LICENSE`](LICENSE).

A MIT é intencionalmente permissiva: permite uso, modificação, distribuição e uso comercial do código, mantendo o aviso de copyright e a licença. Ela também inclui a cláusula padrão de ausência de garantia.

**A MIT não se aplica automaticamente a conteúdo de terceiros.** Para dados meteorológicos, mapas, tiles, bibliotecas, widgets, marcas e serviços externos, consulte [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) e os termos de cada fornecedor.

## Próximos passos possíveis

- previsão horária compacta;
- reordenação de favoritos marítimos;
- sincronização opcional entre dispositivos, caso a transferência manual se mostre insuficiente;
- fallback/substituição configurável para provedores externos;
- PWA, caso o ganho de uso justifique a complexidade adicional.