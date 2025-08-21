
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
document.addEventListener("DOMContentLoaded", function() {
    initializeTabs();
    initializeShopeeCalculator();
    initializeMercadoLivreCalculator();
});

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
    const custoProdutoValue = document.getElementById("custoProduto").value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoShopee;
    
    const impostosValue = document.getElementById("impostos").value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;
    
    const despesasValue = document.getElementById("despesasVariaveis").value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;
    
    const margemDesejada = parseFloat(document.getElementById("margemLucro").value) || 0;
    const temFreteGratis = document.getElementById("freteGratis").checked;

    // Separar custos extras em valores reais e percentuais
    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;
    
    document.querySelectorAll("#custosExtrasContainer .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");

        const valor = parseFloat(valueInput.value.replace(",", ".")) || 0;
        const tipo = typeSelector.value;

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
    document.getElementById("precoVenda").textContent = formatarReal(resultados.precoVenda);
    document.getElementById("lucroPorVenda").textContent = formatarReal(resultados.lucroLiquido);
    document.getElementById("taxaShopee").textContent = formatarReal(resultados.taxaShopeeValor);
    document.getElementById("valorImpostos").textContent = formatarReal(resultados.valorImpostos);
    document.getElementById("custoTotal").textContent = formatarReal(resultados.custoTotalProduto);
    document.getElementById("retornoProduto").textContent = formatarPercentual(resultados.retornoProduto);
    document.getElementById("markupPercent").textContent = formatarPercentual(resultados.markupPercent);
    document.getElementById("markupX").textContent = `${resultados.markupX.toFixed(2)}X`;
    
    // Atualizar cor do lucro
    const lucroPorVendaElement = document.getElementById("lucroPorVenda");
    if (resultados.lucroLiquido > 0) {
        lucroPorVendaElement.style.color = "#4CAF50";
    } else if (resultados.lucroLiquido < 0) {
        lucroPorVendaElement.style.color = "#f44336";
    } else {
        lucroPorVendaElement.style.color = "#ff6b35";
    }
}

function resetarCalculadoraShopee() {
    document.getElementById("custoProduto").value = "";
    document.getElementById("impostos").value = "";
    document.getElementById("despesasVariaveis").value = "";
    document.getElementById("margemLucro").value = 0;
    document.getElementById("freteGratis").checked = true;
    multiplicadorCustoShopee = 1;
    document.querySelector(".multiplier:not([id])").textContent = "1x";
    
    document.getElementById("custosExtrasContainer").innerHTML = '';
    
    atualizarMargemValue(document.getElementById("margemValue"), 0);
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
            document.getElementById("multiplierML").textContent = `${multiplicadorCustoML}x`;
            calcularPrecoVendaML();
        });
    }
    
    if (arrowDownML) {
        arrowDownML.addEventListener("click", () => {
            multiplicadorCustoML = Math.max(1, multiplicadorCustoML - 1);
            document.getElementById("multiplierML").textContent = `${multiplicadorCustoML}x`;
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
    const custoProdutoValue = document.getElementById("custoProdutoML").value || "0";
    const custoProdutoBase = parseFloat(custoProdutoValue.replace(",", ".")) || 0;
    const custoProduto = custoProdutoBase * multiplicadorCustoML;
    
    const impostosValue = document.getElementById("impostosML").value || "0";
    const impostosPercent = parseFloat(impostosValue.replace(",", ".")) || 0;
    
    const despesasValue = document.getElementById("despesasVariaveisML").value || "0";
    const despesasVariaveis = parseFloat(despesasValue.replace(",", ".")) || 0;
    
    const margemDesejada = parseFloat(document.getElementById("margemLucroML").value) || 0;
    
    // Obter taxa do Mercado Livre selecionada
    const taxaMLPercent = parseFloat(document.getElementById("taxaMercadoLivreSelect").value) || 12;
    const taxaML = taxaMLPercent / 100;
    
    // Obter taxa de frete selecionada
    const taxaFrete = parseFloat(document.getElementById("taxaFreteSelect").value) || 0;

    // Separar custos extras em valores reais e percentuais
    let custosExtrasReais = 0;
    let custosExtrasPercentuais = 0;
    
    document.querySelectorAll("#custosExtrasContainerML .custo-extra-item").forEach(item => {
        const valueInput = item.querySelector(".custo-extra-value");
        const typeSelector = item.querySelector(".custo-extra-type-selector");

        const valor = parseFloat(valueInput.value.replace(",", ".")) || 0;
        const tipo = typeSelector.value;

        if (tipo === "real") {
            custosExtrasReais += valor;
        } else if (tipo === "percent") {
            // Custos extras em % são aplicados sobre o preço de venda
            custosExtrasPercentuais += (valor / 100);
        }
    });
    
    // Custo total do produto (custo + custos extras em R$)
    const custoTotalProduto = custoProduto + custosExtrasReais;
    
    // Fórmula corrigida: PV = (Custo Total + Despesas + Frete) / (1 - Taxa ML - Margem - Impostos - Custos Extras %)
    const denominador = (1 - taxaML - (margemDesejada / 100) - (impostosPercent / 100) - custosExtrasPercentuais);
    let precoVenda = 0;
    if (denominador > 0) {
        precoVenda = (custoTotalProduto + despesasVariaveis + taxaFrete) / denominador;
    }

    // Cálculos dos valores baseados no preço de venda
    const valorImpostos = precoVenda * (impostosPercent / 100);
    const valorCustosExtrasPercentuais = precoVenda * custosExtrasPercentuais;
    const taxaMLValor = precoVenda * taxaML;
    const margemLucroValor = precoVenda * (margemDesejada / 100);
    
    // Lucro líquido = Preço de Venda - todos os custos
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
    document.getElementById("precoVendaML").textContent = formatarReal(resultados.precoVenda);
    document.getElementById("lucroPorVendaML").textContent = formatarReal(resultados.lucroLiquido);
    
    // Taxa ML agora inclui comissão + frete
    const taxaFreteValue = parseFloat(document.getElementById("taxaFreteSelect").value) || 0;
    const taxaMLTotal = resultados.taxaMLValor + taxaFreteValue;
    document.getElementById("taxaMercadoLivre").textContent = formatarReal(taxaMLTotal);
    
    document.getElementById("valorImpostosML").textContent = formatarReal(resultados.valorImpostos);
    document.getElementById("custoTotalML").textContent = formatarReal(resultados.custoTotalProduto);
    document.getElementById("retornoProdutoML").textContent = formatarPercentual(resultados.retornoProduto);
    document.getElementById("markupPercentML").textContent = formatarPercentual(resultados.markupPercent);
    document.getElementById("markupXML").textContent = `${resultados.markupX.toFixed(2)}X`;
    
    // Atualizar cor do lucro
    const lucroPorVendaElement = document.getElementById("lucroPorVendaML");
    if (resultados.lucroLiquido > 0) {
        lucroPorVendaElement.style.color = "#4CAF50";
    } else if (resultados.lucroLiquido < 0) {
        lucroPorVendaElement.style.color = "#f44336";
    } else {
        lucroPorVendaElement.style.color = "#ff6b35";
    }
}

function resetarCalculadoraML() {
    document.getElementById("custoProdutoML").value = "";
    document.getElementById("impostosML").value = "";
    document.getElementById("despesasVariaveisML").value = "";
    document.getElementById("margemLucroML").value = 0;
    document.getElementById("taxaMercadoLivreSelect").value = "12";
    document.getElementById("taxaFreteSelect").value = "39.90";
    multiplicadorCustoML = 1;
    document.getElementById("multiplierML").textContent = "1x";
    
    document.getElementById("custosExtrasContainerML").innerHTML = '';
    
    atualizarMargemValue(document.getElementById("margemValueML"), 0);
    calcularPrecoVendaML();
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatarReal(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function formatarPercentual(valor) {
    return `${valor.toFixed(2)}%`;
}

function atualizarMargemValue(element, valor) {
    if (element) {
        element.textContent = `${valor}%`;
    }
}

function atualizarCorMargem(slider, margem) {
    const fillPercentage = (margem / parseFloat(slider.max)) * 100;
    slider.style.setProperty("--track-fill", `${fillPercentage}%`);

    slider.classList.remove(
        'margem-vermelho',
        'margem-laranja',
        'margem-amarelo',
        'margem-verde-lima',
        'margem-verde-claro',
        'margem-azul-ciano',
        'margem-azul-escuro'
    );

    if (margem >= 0 && margem <= 5) {
        slider.classList.add('margem-vermelho');
    } else if (margem >= 6 && margem <= 7) {
        slider.classList.add('margem-laranja');
    } else if (margem >= 8 && margem <= 16) {
        slider.classList.add('margem-amarelo');
    } else if (margem >= 17 && margem <= 24) {
        slider.classList.add('margem-verde-lima');
    } else if (margem >= 25 && margem <= 35) {
        slider.classList.add('margem-verde-claro');
    } else if (margem >= 36 && margem <= 50) {
        slider.classList.add('margem-azul-ciano');
    } else if (margem >= 51 && margem <= 70) {
        slider.classList.add("margem-azul-escuro");
    }
}

function validarEntradaNumerica(input) {
    let value = input.value.replace(/[^0-9.,]/g, "");
    
    if (value.includes(',')) {
        value = value.replace(/\./g, '');
        const parts = value.split(',');
        if (parts.length > 2) {
            value = parts[0] + ',' + parts.slice(1).join('');
        }
    } else if (value.includes('.')) {
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
    }
    
    input.value = value;
}

function formatarCampo(input) {
    let valorString = input.value.replace(",", ".");
    const valor = parseFloat(valorString);
    
    if (!isNaN(valor) && valor >= 0) {
        input.value = valor.toFixed(2).replace(".", ",");
    } else {
        input.value = "0,00";
    }
}

function adicionarCustoExtra(target) {
    const id = `custoExtra-${Date.now()}`;
    const custoExtraWrapper = document.createElement("div");
    custoExtraWrapper.classList.add("custo-extra-wrapper");
    custoExtraWrapper.dataset.id = id;
    custoExtraWrapper.innerHTML = `
        <div class="custo-extra-item">
            <select class="custo-extra-type-selector">
                <option value="real">R$</option>
                <option value="percent">%</option>
            </select>
            <input type="text" class="custo-extra-value" placeholder="0,00">
        </div>
        <button type="button" class="remove-custo-extra-btn">X</button>
    `;

    const container = target === "ML" ? 
        document.getElementById("custosExtrasContainerML") : 
        document.getElementById("custosExtrasContainer");
    
    container.appendChild(custoExtraWrapper);

    // Adicionar listeners para o novo campo
    const inputElement = custoExtraWrapper.querySelector(".custo-extra-value");
    const typeSelector = custoExtraWrapper.querySelector(".custo-extra-type-selector");
    const removeButton = custoExtraWrapper.querySelector(".remove-custo-extra-btn");

    inputElement.addEventListener("input", function() {
        validarEntradaNumerica(this);
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
    
    inputElement.addEventListener("blur", function() {
        formatarCampo(this);
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
    
    typeSelector.addEventListener("change", function() {
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });

    removeButton.addEventListener("click", function() {
        custoExtraWrapper.remove();
        if (target === "ML") {
            calcularPrecoVendaML();
        } else {
            calcularPrecoVendaShopee();
        }
    });
}



// ===== FUNCIONALIDADE DO MENU DE USUÁRIO =====
function initializeUserMenu() {
    const userIconBtn = document.getElementById("userIconBtn");
    const userDropdownMenu = document.getElementById("userDropdownMenu");
    const logoutBtn = document.getElementById("logoutBtn");
    const themeToggle = document.getElementById("themeToggle");

    if (userIconBtn) {
        userIconBtn.addEventListener("click", () => {
            userDropdownMenu.classList.toggle("show");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (themeToggle) {
        // Apply saved theme on page load
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark-theme") {
            document.body.classList.add("dark-theme");
            themeToggle.checked = true;
        } else {
            document.body.classList.remove("dark-theme");
            themeToggle.checked = false;
        }

        themeToggle.addEventListener("change", function() {
            if (this.checked) {
                document.body.classList.add("dark-theme");
                localStorage.setItem("theme", "dark-theme");
            } else {
                document.body.classList.remove("dark-theme");
                localStorage.setItem("theme", "light-theme"); // Or remove item if light is default
            }
        });
    }

    // Fechar o menu se clicar fora
    window.addEventListener("click", (e) => {
        if (!userIconBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
            userDropdownMenu.classList.remove("show");
        }
    });
}

// Adicionar a inicialização do menu de usuário ao DOMContentLoaded
document.addEventListener("DOMContentLoaded", initializeUserMenu);
