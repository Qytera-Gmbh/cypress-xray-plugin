Feature: A tagged feature

  Background: A background
    #@Precondition:CYP-244
		Given abc123
		Then xyz987

  @TestName:CYP-123 @Some @Other @TestName:CYP-456 @Tags
  Scenario: A scenario
    Given an assumption
    When a when
    And an and
    Then a then
