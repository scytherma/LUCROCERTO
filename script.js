// Configurações da Shopee
const SHOPEE_CONFIG = {
    taxaComissaoPadrao: 0.14, // 14%
    taxaComissaoFreteGratis: 0.20, // 20%
    taxaTransacao: 0.00, // 0%
    taxaFixaPorItem: 4.00, // R$4,00 por item vendido
};

// Multiplicadores
let multiplicadorCustoShopee = 1;
let multiplicadorCustoML = 1;

// Sistema de Abas
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-tab').classList.add('active');
        });
    });
}

// ===== CALCULADORA SHOPEE =====
function initializeShopeeCalculator() {
    const elements = {
        freteGratis: document.getElementById("freteGratis"),
        custoProduto: document.getElementById("custoProduto"),
        impostos: document.getElementById("impostos"),
        despesasVariaveis: document.getElementById("despesasVariaveis"),
        margemLucro: document.getElementById("margemLucro"),
        custosExtrasContainer: document.getElementById("custosExtrasContainer"),
        addCustoExtraBtn: document.querySelector(".add-custo-extra-btn:not([data-target])"),
        limparCamposBtn: document.getElementById("limparCamposBtn"),
        
        // Resultados
        precoVenda: document.getElementById("precoVenda"),
        lucroPorVenda: document.getElementById("lucroPorVenda"),
        taxaShopee: document.getElementById("taxaShopee"),
        valorImpostos: document.getElementById("valorImpostos"),
        custoTotal: document.getElementById("custoTotal"),
        retornoProduto: document.getElementById("retornoProduto"),
        markupPercent: document.getElementById("markupPercent"),
        markupX: document.getElementById("markupX"),
        margemValue: document.getElementById("margemValue")
    };

    // Event Listeners
    if (elements.margemLucro) {
        elements.margemLucro.addEventListener("input", function() {
            atualizarMargemValue(elements.margemValue, this.value);
            atualizarCorMargem(this, this.value);
            calcularPrecoVendaShopee();
        });
    }
    
    // Botões do multiplicador
    const arrowUp = document.querySelector(".arrow-up:not([data-target])");
    const arrowDown = document.querySelector(".arrow-down:not([data-target])");
    
    if (arrowUp) {
        arrowUp.addEventListener("click", () => {
            multiplicadorCustoShopee = Math.max(1, multiplicadorCustoShopee + 1);
            document.querySelector(".multiplier:not([id])").textContent = `${multiplicadorCustoShopee}x`;
            calcularPrecoVendaShopee();
        });
    }
    
    if (arrowDown) {
        arrowDown.addEventListener("click", () => {
            multiplicadorCustoShopee = Math.max(1, multiplicadorCustoShopee - 1);
            document.querySelector(".multiplier:not([id])").textContent = `${multiplicadorCustoShopee}x`;
            calcularPrecoVendaShopee();
        });
    }
    
    // Validação de inputs numéricos
    [elements.custoProduto, elements.despesasVariaveis].forEach(element => {
        if (element) {
            element.addEventListener("input", function() {
                validarEntradaNumerica(this);
                calcularPrecoVendaShopee();
            });
            
            element.addEventListener("blur", function() {
                formatarCampo(this);
                calcularPrecoVendaShopee();
            });
        }
    });
    
    // Validação especial para impostos
    if (elements.impostos) {
        elements.impostos.addEventListener("input", function() {
            validarEntradaNumerica(this);
            calcularPrecoVendaShopee();
        });

        elements.impostos.addEventListener("blur", function() {
            let valorString = this.value.replace(",", ".");
            let valor = parseFloat(valorString);
            
            if (isNaN(valor) || valor < 0) {
                this.value = "0,00";
            } else if (valor > 100) {
                this.value = "100,00";
            } else {
                this.value = valor.toFixed(2).replace(".", ",");
            }
            calcularPrecoVendaShopee();
        });
    }

    // Toggle frete grátis
    if (elements.freteGratis) {
        elements.freteGratis.addEventListener("change", calcularPrecoVendaShopee);
    }

    // Botão adicionar custo extra
    if (elements.addCustoExtraBtn) {
        elements.addCustoExtraBtn.addEventListener("click", () => adicionarCustoExtra(""));
    }

    // Botão limpar campos
    if (elements.limparCamposBtn) {
        elements.limparCamposBtn.addEventListener("click", resetarCalculadoraShopee);
    }

    // Cálculo inicial
    atualizarMargemValue(elements.margemValue, 0);
    calcularPrecoVendaShopee();
}

function calcularPrecoVendaShopee() {
    const custoProdutoValue = document.getElementById("custoProduto")?.value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoShopee;
    
    const impostosValue = document.getElementById("impostos")?.value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;
    
    const despesasValue = document.getElementById("despesasVariaveis")?.value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;
    
    const margemDesejada = parseFloat(document.getElementById("margemLucro")?.value) || 0;
    const temFreteGratis = document.getElementById("freteGratis")?.checked;

    // Separar custos extras em valores reais e percentuais
    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;
    
    document.querySelectorAll("#custosExtrasContainer .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");

        const valor = parseFloat(valueInput?.value?.replace(",", ".")) || 0;
        const tipo = typeSelector?.value;

        if (tipo === "real") {
            custosExtrasReais += valor;
        } else if (tipo === "percent") {
            custosExtrasPercentuais += (valor / 100);
        }
    });
    
    const custoTotalProduto = custoProduto + custosExtrasReais;
    const taxaComissaoAplicada = temFreteGratis ? SHOPEE_CONFIG.taxaComissaoFreteGratis : SHOPEE_CONFIG.taxaComissaoPadrao;
    
    const denominador = (1 - taxaComissaoAplicada - (margemDesejada / 100) - (impostosPercent / 100) - custosExtrasPercentuais);
    let precoVenda = 0;
    if (denominador > 0) {
        precoVenda = (custoTotalProduto + despesasVariaveis + SHOPEE_CONFIG.taxaFixaPorItem) / denominador;
    }

    const valorImpostos = precoVenda * (impostosPercent / 100);
    const valorCustosExtrasPercentuais = precoVenda * custosExtrasPercentuais;
    const taxaShopeeComissao = precoVenda * taxaComissaoAplicada;
    const taxaShopeeValorTotal = taxaShopeeComissao + SHOPEE_CONFIG.taxaFixaPorItem;
    
    const lucroLiquido = precoVenda - custoTotalProduto - despesasVariaveis - taxaShopeeValorTotal - valorImpostos - valorCustosExtrasPercentuais;
    
    const retornoProduto = custoTotalProduto > 0 ? (lucroLiquido / custoTotalProduto) * 100 : 0;
    const markupPercent = custoTotalProduto > 0 ? ((precoVenda - custoTotalProduto) / custoTotalProduto) * 100 : 0;
    const markupX = custoTotalProduto > 0 ? precoVenda / custoTotalProduto : 0;
    
    // Atualizar interface
    atualizarResultadosShopee({
        precoVenda,
        lucroLiquido,
        taxaShopeeValor: taxaShopeeValorTotal,
        valorImpostos,
        custoTotalProduto,
        retornoProduto,
        markupPercent,
        markupX
    });
}

function atualizarResultadosShopee(resultados) {
    const precoVendaEl = document.getElementById("precoVenda");
    const lucroPorVendaEl = document.getElementById("lucroPorVenda");
    const taxaShopeeEl = document.getElementById("taxaShopee");
    const valorImpostosEl = document.getElementById("valorImpostos");
    const custoTotalEl = document.getElementById("custoTotal");
    const retornoProdutoEl = document.getElementById("retornoProduto");
    const markupPercentEl = document.getElementById("markupPercent");
    const markupXEl = document.getElementById("markupX");

    if (precoVendaEl) precoVendaEl.textContent = formatarReal(resultados.precoVenda);
    if (lucroPorVendaEl) lucroPorVendaEl.textContent = formatarReal(resultados.lucroLiquido);
    if (taxaShopeeEl) taxaShopeeEl.textContent = formatarReal(resultados.taxaShopeeValor);
    if (valorImpostosEl) valorImpostosEl.textContent = formatarReal(resultados.valorImpostos);
    if (custoTotalEl) custoTotalEl.textContent = formatarReal(resultados.custoTotalProduto);
    if (retornoProdutoEl) retornoProdutoEl.textContent = formatarPercentual(resultados.retornoProduto);
    if (markupPercentEl) markupPercentEl.textContent = formatarPercentual(resultados.markupPercent);
    if (markupXEl) markupXEl.textContent = `${resultados.markupX.toFixed(2)}X`;
    
    // Atualizar cor do lucro
    if (lucroPorVendaEl) {
        if (resultados.lucroLiquido > 0) {
            lucroPorVendaEl.style.color = "#4CAF50";
        } else if (resultados.lucroLiquido < 0) {
            lucroPorVendaEl.style.color = "#f44336";
        } else {
            lucroPorVendaEl.style.color = "#ff6b35";
        }
    }
}

function resetarCalculadoraShopee() {
    const custoProdutoEl = document.getElementById("custoProduto");
    const impostosEl = document.getElementById("impostos");
    const despesasVariaveisEl = document.getElementById("despesasVariaveis");
    const margemLucroEl = document.getElementById("margemLucro");
    const freteGratisEl = document.getElementById("freteGratis");
    const multiplierEl = document.querySelector(".multiplier:not([id])");
    const custosExtrasContainerEl = document.getElementById("custosExtrasContainer");
    const margemValueEl = document.getElementById("margemValue");

    if (custoProdutoEl) custoProdutoEl.value = "";
    if (impostosEl) impostosEl.value = "";
    if (despesasVariaveisEl) despesasVariaveisEl.value = "";
    if (margemLucroEl) margemLucroEl.value = 0;
    if (freteGratisEl) freteGratisEl.checked = true;
    multiplicadorCustoShopee = 1;
    if (multiplierEl) multiplierEl.textContent = "1x";
    
    if (custosExtrasContainerEl) custosExtrasContainerEl.innerHTML = '';
    
    atualizarMargemValue(margemValueEl, 0);
    calcularPrecoVendaShopee();
}

// ===== CALCULADORA MERCADO LIVRE =====
function initializeMercadoLivreCalculator() {
    const elements = {
        custoProduto: document.getElementById("custoProdutoML"),
        impostos: document.getElementById("impostosML"),
        despesasVariaveis: document.getElementById("despesasVariaveisML"),
        taxaMercadoLivreSelect: document.getElementById("taxaMercadoLivreSelect"),
        taxaFreteSelect: document.getElementById("taxaFreteSelect"),
        margemLucro: document.getElementById("margemLucroML"),
        custosExtrasContainer: document.getElementById("custosExtrasContainerML"),
        addCustoExtraBtn: document.querySelector(".add-custo-extra-btn[data-target='ML']"),
        limparCamposBtn: document.getElementById("limparCamposBtnML"),
        
        // Resultados
        precoVenda: document.getElementById("precoVendaML"),
        lucroPorVenda: document.getElementById("lucroPorVendaML"),
        taxaMercadoLivre: document.getElementById("taxaMercadoLivre"),
        valorImpostos: document.getElementById("valorImpostosML"),
        custoTotal: document.getElementById("custoTotalML"),
        retornoProduto: document.getElementById("retornoProdutoML"),
        markupPercent: document.getElementById("markupPercentML"),
        markupX: document.getElementById("markupXML"),
        margemValue: document.getElementById("margemValueML")
    };

    // Event Listeners
    if (elements.margemLucro) {
        elements.margemLucro.addEventListener("input", function() {
            atualizarMargemValue(elements.margemValue, this.value);
            atualizarCorMargem(this, this.value);
            calcularPrecoVendaML();
        });
    }
    
    // Botões do multiplicador
    const arrowUpML = document.querySelector(".arrow-up[data-target='ML']");
    const arrowDownML = document.querySelector(".arrow-down[data-target='ML']");
    
    if (arrowUpML) {
        arrowUpML.addEventListener("click", () => {
            multiplicadorCustoML = Math.max(1, multiplicadorCustoML + 1);
            const multiplierMLEl = document.getElementById("multiplierML");
            if (multiplierMLEl) multiplierMLEl.textContent = `${multiplicadorCustoML}x`;
            calcularPrecoVendaML();
        });
    }
    
    if (arrowDownML) {
        arrowDownML.addEventListener("click", () => {
            multiplicadorCustoML = Math.max(1, multiplicadorCustoML - 1);
            const multiplierMLEl = document.getElementById("multiplierML");
            if (multiplierMLEl) multiplierMLEl.textContent = `${multiplicadorCustoML}x`;
            calcularPrecoVendaML();
        });
    }
    
    // Validação de inputs numéricos
    [elements.custoProduto, elements.despesasVariaveis].forEach(element => {
        if (element) {
            element.addEventListener("input", function() {
                validarEntradaNumerica(this);
                calcularPrecoVendaML();
            });
            
            element.addEventListener("blur", function() {
                formatarCampo(this);
                calcularPrecoVendaML();
            });
        }
    });
    
    // Validação especial para impostos
    if (elements.impostos) {
        elements.impostos.addEventListener("input", function() {
            validarEntradaNumerica(this);
            calcularPrecoVendaML();
        });

        elements.impostos.addEventListener("blur", function() {
            let valorString = this.value.replace(",", ".");
            let valor = parseFloat(valorString);
            
            if (isNaN(valor) || valor < 0) {
                this.value = "0,00";
            } else if (valor > 100) {
                this.value = "100,00";
            } else {
                this.value = valor.toFixed(2).replace(".", ",");
            }
            calcularPrecoVendaML();
        });
    }

    // Selects
    if (elements.taxaMercadoLivreSelect) {
        elements.taxaMercadoLivreSelect.addEventListener("change", calcularPrecoVendaML);
    }
    
    if (elements.taxaFreteSelect) {
        elements.taxaFreteSelect.addEventListener("change", calcularPrecoVendaML);
    }

    // Botão adicionar custo extra
    if (elements.addCustoExtraBtn) {
        elements.addCustoExtraBtn.addEventListener("click", () => adicionarCustoExtra("ML"));
    }

    // Botão limpar campos
    if (elements.limparCamposBtn) {
        elements.limparCamposBtn.addEventListener("click", resetarCalculadoraML);
    }

    // Cálculo inicial
    atualizarMargemValue(elements.margemValue, 0);
    calcularPrecoVendaML();
}

function calcularPrecoVendaML() {
    const custoProdutoValue = document.getElementById("custoProdutoML")?.value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoML;
    
    const impostosValue = document.getElementById("impostosML")?.value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;
    
    const despesasValue = document.getElementById("despesasVariaveisML")?.value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;
    
    const margemDesejada = parseFloat(document.getElementById("margemLucroML")?.value) || 0;
    
    // Obter taxa do Mercado Livre selecionada
    const taxaMLPercent = parseFloat(document.getElementById("taxaMercadoLivreSelect")?.value) || 12;
    const taxaML = taxaMLPercent / 100;
    
    // Obter taxa de frete selecionada
    const taxaFrete = parseFloat(document.getElementById("taxaFreteSelect")?.value) || 0;

    // Separar custos extras em valores reais e percentuais
    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;
    
    document.querySelectorAll("#custosExtrasContainerML .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");

        const valor = parseFloat(valueInput?.value?.replace(",", ".")) || 0;
        const tipo = typeSelector?.value;

        if (tipo === "real") {
            custosExtrasReais += valor;
        } else if (tipo === "percent") {
            custosExtrasPercentuais += (valor / 100);
        }
    });
    
    const custoTotalProduto = custoProduto + custosExtrasReais;
    
    const denominador = (1 - taxaML - (margemDesejada / 100) - (impostosPercent / 100) - custosExtrasPercentuais);
    let precoVenda = 0;
    if (denominador > 0) {
        precoVenda = (custoTotalProduto + despesasVariaveis + taxaFrete) / denominador;
    }

    const valorImpostos = precoVenda * (impostosPercent / 100);
    const valorCustosExtrasPercentuais = precoVenda * custosExtrasPercentuais;
    const taxaMLValor = precoVenda * taxaML;
    
    const lucroLiquido = precoVenda - custoTotalProduto - despesasVariaveis - taxaFrete - taxaMLValor - valorImpostos - valorCustosExtrasPercentuais;
    
    const retornoProduto = custoTotalProduto > 0 ? (lucroLiquido / custoTotalProduto) * 100 : 0;
    const markupPercent = custoTotalProduto > 0 ? ((precoVenda - custoTotalProduto) / custoTotalProduto) * 100 : 0;
    const markupX = custoTotalProduto > 0 ? precoVenda / custoTotalProduto : 0;
    
    // Atualizar interface
    atualizarResultadosML({
        precoVenda,
        lucroLiquido,
        taxaMLValor,
        valorImpostos,
        custoTotalProduto,
        retornoProduto,
        markupPercent,
        markupX
    });
}

function atualizarResultadosML(resultados) {
    const precoVendaEl = document.getElementById("precoVendaML");
    const lucroPorVendaEl = document.getElementById("lucroPorVendaML");
    const taxaMercadoLivreEl = document.getElementById("taxaMercadoLivre");
    const valorImpostosEl = document.getElementById("valorImpostosML");
    const custoTotalEl = document.getElementById("custoTotalML");
    const retornoProdutoEl = document.getElementById("retornoProdutoML");
    const markupPercentEl = document.getElementById("markupPercentML");
    const markupXEl = document.getElementById("markupXML");

    if (precoVendaEl) precoVendaEl.textContent = formatarReal(resultados.precoVenda);
    if (lucroPorVendaEl) lucroPorVendaEl.textContent = formatarReal(resultados.lucroLiquido);
    if (taxaMercadoLivreEl) taxaMercadoLivreEl.textContent = formatarReal(resultados.taxaMLValor);
    if (valorImpostosEl) valorImpostosEl.textContent = formatarReal(resultados.valorImpostos);
    if (custoTotalEl) custoTotalEl.textContent = formatarReal(resultados.custoTotalProduto);
    if (retornoProdutoEl) retornoProdutoEl.textContent = formatarPercentual(resultados.retornoProduto);
    if (markupPercentEl) markupPercentEl.textContent = formatarPercentual(resultados.markupPercent);
    if (markupXEl) markupXEl.textContent = `${resultados.markupX.toFixed(2)}X`;
    
    // Atualizar cor do lucro
    if (lucroPorVendaEl) {
        if (resultados.lucroLiquido > 0) {
            lucroPorVendaEl.style.color = "#4CAF50";
        } else if (resultados.lucroLiquido < 0) {
            lucroPorVendaEl.style.color = "#f44336";
        } else {
            lucroPorVendaEl.style.color = "#ff6b35";
        }
    }
}

function resetarCalculadoraML() {
    const custoProdutoEl = document.getElementById("custoProdutoML");
    const impostosEl = document.getElementById("impostosML");
    const despesasVariaveisEl = document.getElementById("despesasVariaveisML");
    const margemLucroEl = document.getElementById("margemLucroML");
    const multiplierMLEl = document.getElementById("multiplierML");
    const custosExtrasContainerEl = document.getElementById("custosExtrasContainerML");
    const margemValueEl = document.getElementById("margemValueML");

    if (custoProdutoEl) custoProdutoEl.value = "";
    if (impostosEl) impostosEl.value = "";
    if (despesasVariaveisEl) despesasVariaveisEl.value = "";
    if (margemLucroEl) margemLucroEl.value = 0;
    multiplicadorCustoML = 1;
    if (multiplierMLEl) multiplierMLEl.textContent = "1x";
    
    if (custosExtrasContainerEl) custosExtrasContainerEl.innerHTML = '';
    
    atualizarMargemValue(margemValueEl, 0);
    calcularPrecoVendaML();
}

// ===== FUNÇÕES AUXILIARES =====
function validarEntradaNumerica(input) {
    let valor = input.value;
    
    // Remove caracteres não numéricos, exceto vírgula e ponto
    valor = valor.replace(/[^0-9,\.]/g, '');
    
    // Substitui ponto por vírgula
    valor = valor.replace(/\./g, ',');
    
    // Permite apenas uma vírgula
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limita a 2 casas decimais após a vírgula
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    input.value = valor;
}

function formatarCampo(input) {
    let valorString = input.value.replace(",", ".");
    let valor = parseFloat(valorString);
    
    if (isNaN(valor) || valor < 0) {
        input.value = "0,00";
    } else {
        input.value = valor.toFixed(2).replace(".", ",");
    }
}

function formatarReal(valor) {
    if (isNaN(valor)) return "R$ 0,00";
    return "R$ " + valor.toFixed(2).replace(".", ",");
}

function formatarPercentual(valor) {
    if (isNaN(valor)) return "0%";
    return valor.toFixed(2).replace(".", ",") + "%";
}

function atualizarMargemValue(element, valor) {
    if (element) {
        element.textContent = valor + "%";
    }
}

function atualizarCorMargem(slider, valor) {
    if (!slider) return;
    
    const percentage = (valor - slider.min) / (slider.max - slider.min) * 100;
    
    let cor;
    if (valor <= 10) {
        cor = "#f44336"; // Vermelho
    } else if (valor <= 20) {
        cor = "#ff9800"; // Laranja
    } else if (valor <= 30) {
        cor = "#ffeb3b"; // Amarelo
    } else {
        cor = "#4caf50"; // Verde
    }
    
    slider.style.background = `linear-gradient(to right, ${cor} 0%, ${cor} ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
}

function adicionarCustoExtra(target) {
    const containerId = target === "ML" ? "custosExtrasContainerML" : "custosExtrasContainer";
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const custoExtraId = Date.now();
    const custoExtraHTML = `
        <div class="custo-extra-item" data-id="${custoExtraId}">
            <div class="custo-extra-input-wrapper">
                <input type="text" class="custo-extra-value" placeholder="0,00">
                <select class="custo-extra-type-selector">
                    <option value="real">R$</option>
                    <option value="percent">%</option>
                </select>
                <button type="button" class="remove-custo-extra-btn" onclick="removerCustoExtra(${custoExtraId})">×</button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', custoExtraHTML);
    
    // Adicionar event listeners para o novo campo
    const newItem = container.querySelector(`[data-id="${custoExtraId}"]`);
    const valueInput = newItem.querySelector('.custo-extra-value');
    const typeSelector = newItem.querySelector('.custo-extra-type-selector');
    
    valueInput.addEventListener('input', function() {
        validarEntradaNumerica(this);
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
    
    valueInput.addEventListener('blur', function() {
        formatarCampo(this);
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
    
    typeSelector.addEventListener('change', function() {
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
}

function removerCustoExtra(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
        item.remove();
        // Recalcular após remoção
        calcularPrecoVendaShopee();
        calcularPrecoVendaML();
    }
}
