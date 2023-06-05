Feature: A tagged feature with examples

  Feature file for example parsing purposes.

  @TestName:CYP-123
  Scenario Outline: A tagged scenario with examples
    Given a <Header 1>
    When a <Header 2>
    Then <Header 3>

    Examples:
      | Header 1 | Header 2 | Header 3 |
      | A 1      | A 2      | A 3      |
      | B 1      | B 2      | B 3      |

    Examples:
      | Header 1 | Header 2 | Header 3 |
      | C 1      | C 2      | C 3      |
