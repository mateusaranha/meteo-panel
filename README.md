# MeteoPanel — protótipo

Painel meteorológico estático para consultar **Windy**, **Windguru**, **Open-Meteo** e **temperatura do mar** na mesma página.

## Objetivo do protótipo

- zero backend;
- zero banco de dados;
- sem framework de aplicação;
- compatível com GitHub Pages;
- layout responsivo para desktop e celular;
- cada fonte continua responsável pelos próprios dados.

O local meteorológico inicial configurado é **Florianópolis, SC**.

## Fontes

- **Windy**: mapa meteorológico interativo;
- **Windguru**: tabela técnica de vento, rajadas e modelos;
- **Open-Meteo Forecast**: condições atuais e previsão resumida dos próximos dias;
- **Open-Meteo Marine**: temperatura superficial estimada do mar nos locais favoritos;
- **OpenStreetMap + Leaflet**: mapa usado somente para escolher as coordenadas dos favoritos marítimos.

## Temperatura do mar

O módulo permite:

- adicionar locais favoritos;
- escolher o ponto clicando no mapa ou arrastando o marcador;
- editar nome e coordenadas;
- alternar rapidamente entre favoritos;
- remover um favorito com confirmação;
- consultar a temperatura superficial estimada do mar para o ponto selecionado.

Os favoritos são armazenados em `localStorage`. Isso mantém o MeteoPanel sem contas, backend ou banco de dados, mas significa que a lista é específica de cada navegador/dispositivo.

Há um ponto inicial de exemplo chamado **Campeche**, que pode ser editado ou removido normalmente.

A temperatura do mar é modelada e não deve ser interpretada como uma medição in situ junto à areia. O módulo usa preferência por célula marítima para pontos costeiros.

## Estrutura

```text
index.html
styles.css
config.js
app.js
README.md
```

## Rodar localmente

Por usar conteúdo e dados externos, é melhor servir os arquivos por HTTP em vez de abrir `index.html` diretamente pelo Explorador de Arquivos.

Com Python instalado:

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

## Publicar no GitHub Pages

1. Em **Settings → Pages**, escolha a branch principal e a pasta `/ (root)`.
2. Salve.

Não há etapa de build.

## Configuração

Os dados gerais ficam em `config.js`:

- coordenadas usadas pelo Windy e Open-Meteo;
- ID do spot no Windguru;
- chaves de armazenamento local do módulo marítimo;
- favoritos marítimos usados somente quando ainda não existe configuração salva no navegador.

O protótipo usa o spot `105160` do Windguru para Florianópolis.

## Open-Meteo

O painel consulta diretamente as APIs públicas do Open-Meteo no navegador.

A previsão geral mostra:

- temperatura atual;
- sensação térmica;
- condição meteorológica;
- vento e rajadas;
- precipitação atual;
- máxima e mínima dos próximos 5 dias;
- probabilidade e acumulado diário de precipitação.

O módulo marítimo mostra a temperatura superficial estimada para o favorito selecionado.

## Próximos passos sugeridos

- validar os valores marítimos nos locais realmente usados;
- avaliar previsão horária compacta;
- considerar reordenação dos favoritos;
- considerar exportar/importar favoritos entre dispositivos;
- adicionar PWA apenas se fizer sentido.
