/**
 * Converte um número para sua representação por extenso em português do Brasil (Reais e Centavos).
 * @param valor Número a ser convertido
 */
export function numeroParaExtenso(valor: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const dezenaEspecial = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converterGrupo(n: number): string {
    if (n === 0) return "";
    let res = "";
    
    // Centenas
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) {
        res += "cem";
      } else {
        res += centenas[c];
      }
    }
    
    // Dezenas/Unidades
    const resto = n % 100;
    if (resto > 0) {
      if (res !== "") res += " e ";
      if (resto >= 10 && resto < 20) {
        res += dezenaEspecial[resto - 10];
      } else {
        if (d > 0) {
          res += dezenas[d];
          if (u > 0) res += " e " + unidades[u];
        } else {
          res += unidades[u];
        }
      }
    }
    
    return res;
  }
  
  if (valor === 0) return "zero reais";
  
  const partes = [];
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  const milhoes = Math.floor(inteiro / 1000000);
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  const restoInteiro = inteiro % 1000;
  
  if (milhoes > 0) {
    partes.push(converterGrupo(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
  }
  
  if (milhares > 0) {
    const milStr = converterGrupo(milhares);
    // Em português costuma-se dizer apenas "mil" quando é exatamente 1 milhar, 
    // exceto se for "um milhão e um mil". Vamos omitir o "um" antes do "mil" para soar mais natural.
    partes.push((milhares === 1 ? "" : milStr + " ") + "mil");
  }
  
  if (restoInteiro > 0) {
    // Ligações com "e" antes do último grupo se for menor que 100 ou múltiplo de 100
    const precisaE = (milhoes > 0 || milhares > 0) && (restoInteiro < 100 || restoInteiro % 100 === 0);
    const grupoStr = converterGrupo(restoInteiro);
    if (precisaE) {
      partes.push("e " + grupoStr);
    } else {
      if (partes.length > 0 && !partes[partes.length - 1].startsWith("e ")) {
        // Adiciona "e" se não for seguido por mil ou milhão diretamente
        partes.push("e " + grupoStr);
      } else {
        partes.push(grupoStr);
      }
    }
  }
  
  let textoReais = partes.join(" ").replace(/\s+e\s+e\s+/g, " e ").trim();
  // Se for "e cento e cinquenta", tira o "e" inicial se for o único, mas aqui partes junta
  if (textoReais.startsWith("e ")) {
    textoReais = textoReais.substring(2);
  }
  
  if (inteiro > 0) {
    if (inteiro % 1000000 === 0) {
      textoReais += " de reais";
    } else {
      textoReais += (inteiro === 1 ? " real" : " reais");
    }
  }
  
  if (centavos > 0) {
    const centavosStr = centavos >= 10 && centavos < 20
      ? dezenaEspecial[centavos - 10]
      : dezenas[Math.floor(centavos / 10)] + (centavos % 10 > 0 ? " e " + unidades[centavos % 10] : "");
      
    const textoCentavos = centavosStr + (centavos === 1 ? " centavo" : " centavos");
    if (inteiro > 0) {
      textoReais += " e " + textoCentavos;
    } else {
      textoReais = textoCentavos;
    }
  }
  
  return textoReais;
}
