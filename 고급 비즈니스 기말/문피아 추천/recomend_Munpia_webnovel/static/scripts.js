document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const titleInput = document.getElementById("title");
    const resultsContainer = document.getElementById("results");

    // 자동완성 컨테이너 생성
    const autocompleteContainer = document.createElement("div");
    autocompleteContainer.id = "autocomplete-container";
    autocompleteContainer.style.position = "absolute";
    autocompleteContainer.style.border = "1px solid #ccc";
    autocompleteContainer.style.backgroundColor = "#fff";
    autocompleteContainer.style.zIndex = "1000";
    autocompleteContainer.style.maxHeight = "200px";
    autocompleteContainer.style.overflowY = "auto";
    autocompleteContainer.style.display = "none";
    titleInput.parentNode.appendChild(autocompleteContainer);

    let activeSuggestionIndex = -1;

    // 자동완성 기능
    titleInput.addEventListener("input", async (event) => {
        const query = event.target.value.trim();
        autocompleteContainer.innerHTML = "";
        activeSuggestionIndex = -1;

        if (query.length > 0) {
            try {
                const response = await fetch(`/autocomplete?query=${encodeURIComponent(query)}`);
                const suggestions = await response.json();

                if (suggestions.length > 0) {
                    autocompleteContainer.style.display = "block";
                    autocompleteContainer.style.width = `${titleInput.offsetWidth}px`;
                    suggestions.forEach((suggestion, index) => {
                        const suggestionItem = document.createElement("div");
                        suggestionItem.textContent = suggestion;
                        suggestionItem.style.padding = "10px";
                        suggestionItem.style.cursor = "pointer";
                        suggestionItem.style.borderBottom = "1px solid #eee";

                        if (index === activeSuggestionIndex) {
                            suggestionItem.style.backgroundColor = "#f4f4f4";
                        }

                        // 클릭 시 입력란에 제목 삽입
                        suggestionItem.addEventListener("click", () => {
                            titleInput.value = suggestion;
                            autocompleteContainer.style.display = "none";
                        });

                        autocompleteContainer.appendChild(suggestionItem);
                    });
                } else {
                    autocompleteContainer.style.display = "none";
                }
            } catch (error) {
                console.error("자동완성 데이터를 가져오는 중 오류 발생:", error);
            }
        } else {
            autocompleteContainer.style.display = "none";
        }
    });

    // 키보드 조작 (Arrow Up/Down, Enter)
    titleInput.addEventListener("keydown", (event) => {
        if (autocompleteContainer.style.display === "block") {
            const suggestionItems = autocompleteContainer.childNodes;

            if (event.key === "ArrowDown") {
                // 아래로 이동
                event.preventDefault();
                activeSuggestionIndex =
                    (activeSuggestionIndex + 1) % suggestionItems.length;
                updateAutocompleteHighlight(suggestionItems);
            } else if (event.key === "ArrowUp") {
                // 위로 이동
                event.preventDefault();
                activeSuggestionIndex =
                    (activeSuggestionIndex - 1 + suggestionItems.length) %
                    suggestionItems.length;
                updateAutocompleteHighlight(suggestionItems);
            } else if (event.key === "Enter") {
                // 선택된 항목을 입력란에 추가
                event.preventDefault();
                if (activeSuggestionIndex >= 0 && suggestionItems[activeSuggestionIndex]) {
                    titleInput.value = suggestionItems[activeSuggestionIndex].textContent;
                    autocompleteContainer.style.display = "none";
                }
                form.requestSubmit(); // 검색 폼 제출
            }
        }
    });

    // 자동완성 하이라이트 업데이트
    function updateAutocompleteHighlight(suggestionItems) {
        suggestionItems.forEach((item, index) => {
            item.style.backgroundColor =
                index === activeSuggestionIndex ? "#f4f4f4" : "#fff";
        });
    }

    // 검색 결과 제출 및 동적 렌더링
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // 기본 폼 제출 동작 방지
        const title = titleInput.value.trim();

        if (!title) {
            alert("추천받고 싶은 웹소설 제목을 입력하세요.");
            return;
        }

        // 기존 결과 초기화
        resultsContainer.innerHTML = "<p>결과를 불러오는 중입니다...</p>";

        try {
            const response = await fetch("/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `title=${encodeURIComponent(title)}`,
            });

            if (!response.ok) {
                throw new Error("추천 결과를 가져오는 중 문제가 발생했습니다.");
            }

            const data = await response.json();
            console.log("API 응답 데이터:", data); // 디버깅용 로그

            // 추천 결과 렌더링
            resultsContainer.innerHTML = `<h2>'${data.title}'에 대한 추천 결과</h2>`;
            if (data.recommendations && data.recommendations.length > 0) {
                data.recommendations.forEach((rec, index) => {
                    const resultItem = document.createElement("div");
                    resultItem.className = "result-item";

                    resultItem.innerHTML = `
                        <div class="result-title">${index + 1}. ${rec.title}</div>
                        <div class="result-author">저자: ${rec.author || "알 수 없음"}</div>
                        <div class="result-similarity">유사도: ${rec.similarity.toFixed(2)}</div>
                    `;
                    resultsContainer.appendChild(resultItem);
                });
            } else {
                resultsContainer.innerHTML += "<p>추천 결과가 없습니다.</p>";
            }
        } catch (error) {
            console.error("추천 결과 오류:", error);
            resultsContainer.innerHTML = `<p>${error.message}</p>`;
        }
    });
});
